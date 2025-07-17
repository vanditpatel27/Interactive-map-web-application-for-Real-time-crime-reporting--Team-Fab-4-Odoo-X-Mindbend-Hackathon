//hotspotService.js
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import CrimeReport from '../../../db/mongodb/models/CrimeReport.ts';
import CrimeHotspot from '../../../db/mongodb/models/CrimeHotspot.js';
import fs from 'fs';
import { read, utils } from 'xlsx'; // make sure this is imported




const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, 'hotspot_model.py');

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

export const getHotspots = async () => {
  try {
    console.log('Starting hotspot analysis...');
    const startTime = Date.now();

    // Find the most recent hotspot data
    const lastHotspot = await CrimeHotspot.findOne().sort({ lastUpdated: -1 });
    
    // Check if we need to update
    const shouldUpdate = !lastHotspot || 
      (Date.now() - lastHotspot.lastUpdated.getTime()) > CACHE_DURATION;

    if (!shouldUpdate) {
      return lastHotspot.clusters;
    }

    // If update needed, run ML model
    console.log('Running ML model for hotspot computation...');
    const newHotspots = await updateHotspotstemp("./data.csv");
    
    const modelTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`ML model completed in ${modelTime} seconds, identified ${newHotspots.length} hotspots`);
    
    // Store new results
    console.log('Storing hotspot data in database...');
    const savedHotspots = await CrimeHotspot.create({
      clusters: newHotspots,
      lastUpdated: new Date()
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Successfully stored ${savedHotspots.clusters.length} hotspots in database`);
    console.log(`Total processing time: ${totalTime} seconds`);

    return newHotspots;

  } catch (error) {
    // If update fails, return last known data if available
    const lastHotspot = await CrimeHotspot.findOne().sort({ lastUpdated: -1 });
    if (lastHotspot) {
      return lastHotspot.clusters;
    }
    throw error;
  }
};

// Existing updateHotspots function becomes private
const updateHotspots = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 10000);

    const reports = await CrimeReport.find({
    }).lean();

    console.log(`Found ${reports.length} crime reports for processing`);
    
    // Log a sample report to verify data format
    if (reports.length > 0) {
      console.log('Sample report data:', JSON.stringify(reports[0]));
    } else {
      console.log('No crime reports found in the last 30 days');
    }

    if (reports.length === 0) {
      return []; // Return empty array if no reports
    }

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const pythonProcess = spawn('python', [
        MODEL_PATH,
        'train',
        JSON.stringify(reports)
      ]);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          const outputStr = stdout.trim();
          const errorStr = stderr.trim();

          if (code !== 0) {
            console.error('Python process error:', errorStr);
            resolve([]);
            return;
          }

          console.log('Raw output:', outputStr);

          // Handle empty results
          if (!outputStr || outputStr === '[]') {
            resolve([]);
            return;
          }

          // Clean the output string of escape characters
          const cleanOutput = outputStr.replace(/\\/g, '').replace(/\"\[/g, '[').replace(/\]\"/g, ']');
          console.log('Cleaned output:', cleanOutput);

          try {
            const hotspots = JSON.parse(cleanOutput);
            if (!Array.isArray(hotspots)) {
              console.error('Invalid format - not an array');
              resolve([]);
              return;
            }
            resolve(hotspots);
          } catch (parseError) {
            console.error('JSON Parse error:', parseError);
            resolve([]);
          }

        } catch (error) {
          console.error('Process error:', error);
          console.error('Raw stdout:', stdout);
          console.error('Raw stderr:', stderr);
          resolve([]);
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Spawn error:', error);
        resolve([]);
      });
    });
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};


// const MODEL_PATH = 'path/to/your/model.py'; // Update with your actual model path

const updateHotspotstemp = async (csvFilePath) => {
    try {
      if (!csvFilePath.endsWith('.csv')) {
        console.error('Only CSV files are supported in this function.');
        return [];
      }
  
      // ✅ Read and parse CSV properly using xlsx
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const workbook = read(csvData, { type: 'string' });// <-- Fixed here
      const sheetName = workbook.SheetNames[0];
      const rawReports = utils.sheet_to_json(workbook.Sheets[sheetName]); // <-- Fixed here
  
      console.log(`Found ${rawReports.length} crime reports in CSV file`);
  
      if (rawReports.length === 0) {
        console.log('No crime reports found in the CSV file');
        return [];
      }
  
      const transformedReports = rawReports.map(report => {
        let reportDate = new Date();
        if (report.report_date) {
          if (typeof report.report_date === 'number') {
            reportDate = new Date((report.report_date - 25569) * 86400 * 1000);
          } else {
            reportDate = new Date(report.report_date);
          }
        }
        const isoDate = reportDate.toISOString();
  
        return {
          crimeType: report.standardized_offense || report.offense_group || 'UNKNOWN',
          location: {
            lat: parseFloat(report.latitude) || 0,
            lng: parseFloat(report.longitude) || 0
          },
          reportedAt: isoDate,
          method: report.method,
          block: report.block,
          ward: report.ward,
          district: report.district,
          psa: report.psa,
          neighborhood: report.neighborhood_cluster
        };
      });
  
      const validReports = transformedReports.filter(report => {
        return report.location.lat !== 0 && report.location.lng !== 0;
      });
  
      console.log(`Transformed ${validReports.length} valid reports for processing`);
      if (validReports.length === 0) {
        console.log('No valid reports after transformation');
        return [];
      }
  
      const tempFilePath = path.join(os.tmpdir(), `crime_data_${Date.now()}.json`);
      fs.writeFileSync(tempFilePath, JSON.stringify(validReports));
      console.log(`Wrote crime data to temporary file: ${tempFilePath}`);
  
      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';
  
        const pythonProcess = spawn('python', [MODEL_PATH, tempFilePath]);
  
        pythonProcess.stdout.on('data', (data) => {
          stdout += data.toString();
        });
  
        pythonProcess.stderr.on('data', (data) => {
          stderr += data.toString();
          console.error(`Python stderr: ${data.toString()}`);
        });
  
        pythonProcess.on('close', (code) => {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log('Removed temporary file');
          }
  
          const outputStr = stdout.trim();
  
          if (code !== 0) {
            console.error('Python process error (code ' + code + '):', stderr);
            resolve([]);
            return;
          }
  
          if (!outputStr || outputStr === '[]') {
            console.log('No hotspots identified');
            resolve([]);
            return;
          }
  
          const cleanOutput = outputStr.replace(/\\/g, '').replace(/\"\[/g, '[').replace(/\]\"/g, ']');
  
          try {
            const hotspots = JSON.parse(cleanOutput);
            if (!Array.isArray(hotspots)) {
              console.error('Invalid format - not an array');
              resolve([]);
              return;
            }
  
            console.log(`Successfully identified ${hotspots.length} hotspots`);
            resolve(hotspots);
          } catch (parseError) {
            console.error('JSON Parse error:', parseError);
            console.error('Failed output excerpt:', cleanOutput.substring(0, 200));
            resolve([]);
          }
        });
  
        pythonProcess.on('error', (error) => {
          console.error('Spawn error:', error);
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log('Removed temporary file after error');
          }
          resolve([]);
        });
      });
    } catch (error) {
      console.error('Error in updateHotspotstemp:', error);
      return [];
    }
  };
  
  