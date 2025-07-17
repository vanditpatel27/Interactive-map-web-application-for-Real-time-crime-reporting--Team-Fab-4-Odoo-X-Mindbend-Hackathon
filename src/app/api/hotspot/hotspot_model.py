import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timezone
import sys
import json
import traceback

class CrimeHotspotPredictor:
    def __init__(self):
        # Strict parameters for very small clusters
        self.eps = 0.009  # Approximately 1km in degrees (1/111)
        self.min_samples = 2  # Minimum points to form a cluster
        self.time_decay_factor = 0.8  # How recent crimes are weighted
        self.max_radius = 1.0  # Strict maximum radius of 1km
        self.max_clusters_per_type = 2  # Maximum 2 clusters per crime type
        
    def prepare_data(self, crime_data):
        try:
            df = pd.DataFrame(crime_data)
            
            # Extract coordinates
            if 'location' in df.columns:
                df['lat'] = df['location'].apply(lambda x: float(x.get('lat', 0)))
                df['lng'] = df['location'].apply(lambda x: float(x.get('lng', 0)))
            
            # Calculate time weights
            current_time = datetime.now(timezone.utc)
            if 'reportedAt' in df.columns:
                df['time_weight'] = df['reportedAt'].apply(
                    lambda x: self._calculate_time_weight(x, current_time)
                )
            else:
                df['time_weight'] = 1.0  # Default weight if no time data
                
            return df
            
        except Exception as e:
            print(json.dumps({'error': f"Data preparation error: {str(e)}"}), file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return None

    def _calculate_time_weight(self, reported_time, current_time):
        """Calculate weight based on how recent the crime is"""
        if isinstance(reported_time, str):
            try:
                reported_time = datetime.fromisoformat(reported_time.replace('Z', '+00:00'))
            except:
                return 1.0
        
        # Calculate days difference
        days_diff = (current_time - reported_time).total_seconds() / (24 * 3600)
        # More recent crimes have higher weight
        return max(0.1, np.exp(-days_diff / 30) * self.time_decay_factor)

    def train(self, crime_data):
        try:
            df = self.prepare_data(crime_data)
            if df is None or len(df) == 0:
                return []
                
            # Dictionary to store clusters by crime type
            clusters_by_type = {}
            
            # Process each crime type separately
            for crime_type in df['crimeType'].unique():
                type_data = df[df['crimeType'] == crime_type]
                
                # Create small, high-density clusters for this crime type
                type_clusters = self._create_small_clusters(
                    type_data[['lat', 'lng']].values,
                    weights=type_data['time_weight'].values,
                    crime_type=crime_type
                )
                
                # Store the clusters
                clusters_by_type[crime_type] = type_clusters
            
            # Filter to keep only top clusters per crime type
            final_results = []
            for crime_type, clusters in clusters_by_type.items():
                if not clusters:
                    continue
                    
                # Sort by density (highest first)
                clusters.sort(key=lambda x: x.get('density', 0), reverse=True)
                
                # Keep only top clusters (maximum 2 per crime type)
                top_clusters = clusters[:self.max_clusters_per_type]
                final_results.extend(top_clusters)
            
            return final_results

        except Exception as e:
            print(f"Error in training: {str(e)}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            return []

    def _create_small_clusters(self, coordinates, weights=None, crime_type="unknown"):
        """Create small, high-density clusters with strict 1km radius limit"""
        if len(coordinates) == 0:
            return []
            
        if len(coordinates) == 1:
            # Single point becomes its own cluster
            return [{
                'center': coordinates[0].tolist(),
                'radius': self.max_radius,  # Exactly 1km radius
                'density': float(weights[0] if weights is not None else 1.0),
                'primary_type': crime_type,
                'count': 1
            }]
        
        # To ensure very small clusters, we'll use hierarchical density-based clustering
        # First, create many small clusters with very small eps
        results = []
        
        # Method 1: Use DBSCAN with very small eps
        try:
            # Use a very small eps value (approximately 1km)
            eps = self.eps
            dbscan = DBSCAN(eps=eps, min_samples=self.min_samples)
            labels = dbscan.fit_predict(coordinates)
            
            # If DBSCAN found clusters (not all noise)
            if -1 not in labels or len(set(labels)) > 1:
                # Process each cluster
                for label in set(labels):
                    if label != -1:  # Skip noise points
                        cluster_mask = labels == label
                        cluster_points = coordinates[cluster_mask]
                        cluster_weights = weights[cluster_mask] if weights is not None else np.ones(len(cluster_points))
                        
                        # Calculate weighted center
                        if np.sum(cluster_weights) > 0:
                            center = np.average(cluster_points, axis=0, weights=cluster_weights)
                        else:
                            center = np.mean(cluster_points, axis=0)
                        
                        # Calculate radius as max distance from center
                        distances = np.array([
                            self._haversine_distance(center, point) 
                            for point in cluster_points
                        ])
                        
                        # Skip if cluster is too large
                        if np.max(distances) > self.max_radius:
                            continue
                        
                        # Create the cluster
                        results.append({
                            'center': center.tolist(),
                            'radius': min(float(np.max(distances)), self.max_radius),  # Ensure it's no larger than max_radius
                            'density': float(np.sum(cluster_weights)),
                            'primary_type': crime_type,
                            'count': int(len(cluster_points))
                        })
        except Exception as e:
            print(f"DBSCAN clustering failed: {str(e)}", file=sys.stderr)
        
        # Method 2: If DBSCAN didn't work well, try iterative KMeans
        if not results:
            try:
                # Try with different numbers of clusters to find small ones
                best_clusters = []
                
                # Try different K values to find small clusters
                for k in range(max(2, len(coordinates) // 3), min(len(coordinates) // 2 + 1, 20)):
                    kmeans = KMeans(n_clusters=k, random_state=42)
                    kmeans.fit(coordinates)
                    
                    # Calculate center and radius for each cluster
                    for i in range(k):
                        cluster_mask = kmeans.labels_ == i
                        cluster_points = coordinates[cluster_mask]
                        
                        if len(cluster_points) < 2:
                            continue
                            
                        cluster_weights = weights[cluster_mask] if weights is not None else np.ones(len(cluster_points))
                        
                        # Calculate weighted center
                        if np.sum(cluster_weights) > 0:
                            center = np.average(cluster_points, axis=0, weights=cluster_weights)
                        else:
                            center = np.mean(cluster_points, axis=0)
                        
                        # Calculate radius
                        distances = np.array([
                            self._haversine_distance(center, point) 
                            for point in cluster_points
                        ])
                        
                        # Only consider clusters with radius <= 1km
                        if np.max(distances) <= self.max_radius:
                            cluster = {
                                'center': center.tolist(),
                                'radius': min(float(np.max(distances)), self.max_radius),
                                'density': float(np.sum(cluster_weights)),
                                'primary_type': crime_type,
                                'count': int(len(cluster_points)),
                                'method': f'kmeans_{k}'
                            }
                            best_clusters.append(cluster)
                
                # Sort by density and take the best ones
                if best_clusters:
                    best_clusters.sort(key=lambda x: x['density'], reverse=True)
                    results = best_clusters[:10]  # Keep top 10 for filtering later
            except Exception as e:
                print(f"KMeans clustering failed: {str(e)}", file=sys.stderr)
        
        # Method 3: If still no good clusters, use a gridded approach (fallback)
        if not results:
            # Create a grid of points and find high-density areas
            try:
                # Calculate grid size based on area covered
                lat_min, lat_max = np.min(coordinates[:, 0]), np.max(coordinates[:, 0])
                lng_min, lng_max = np.min(coordinates[:, 1]), np.max(coordinates[:, 1])
                
                # Create a grid with ~1km spacing (~0.01 degrees)
                grid_size = 0.009  # Approximately 1km in degrees
                grid_lat = np.arange(lat_min, lat_max + grid_size, grid_size)
                grid_lng = np.arange(lng_min, lng_max + grid_size, grid_size)
                
                grid_centers = []
                grid_densities = []
                
                # Check density around each grid point
                for lat in grid_lat:
                    for lng in grid_lng:
                        grid_point = np.array([lat, lng])
                        
                        # Find points within 1km of this grid point
                        distances = np.array([
                            self._haversine_distance(grid_point, point) 
                            for point in coordinates
                        ])
                        
                        nearby_mask = distances <= self.max_radius
                        if np.sum(nearby_mask) >= 2:  # At least 2 points
                            nearby_weights = weights[nearby_mask] if weights is not None else np.ones(np.sum(nearby_mask))
                            grid_centers.append(grid_point)
                            grid_densities.append({
                                'center': grid_point.tolist(),
                                'radius': self.max_radius,
                                'density': float(np.sum(nearby_weights)),
                                'primary_type': crime_type,
                                'count': int(np.sum(nearby_mask)),
                                'method': 'grid'
                            })
                
                # Sort by density and keep the top ones
                if grid_densities:
                    grid_densities.sort(key=lambda x: x['density'], reverse=True)
                    results = grid_densities[:5]  # Keep top 5
            except Exception as e:
                print(f"Grid clustering failed: {str(e)}", file=sys.stderr)
        
        # Final fallback: if still no results, just pick the highest density point
        if not results and len(coordinates) > 0:
            # Find the point with highest density in its immediate surroundings
            best_point = 0
            best_density = 0
            
            for i in range(len(coordinates)):
                point = coordinates[i]
                distances = np.array([
                    self._haversine_distance(point, other_point) 
                    for other_point in coordinates
                ])
                
                nearby_mask = distances <= self.max_radius
                if np.sum(nearby_mask) >= 1:
                    nearby_weights = weights[nearby_mask] if weights is not None else np.ones(np.sum(nearby_mask))
                    density = float(np.sum(nearby_weights))
                    
                    if density > best_density:
                        best_density = density
                        best_point = i
            
            # Create a single cluster with the best point as center
            results.append({
                'center': coordinates[best_point].tolist(),
                'radius': self.max_radius,
                'density': float(weights[best_point] if weights is not None else 1.0),
                'primary_type': crime_type,
                'count': 1,
                'method': 'fallback'
            })
            
        return results

    def _haversine_distance(self, point1, point2):
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        lat1, lon1 = point1
        lat2, lon2 = point2
        
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        
        a = (np.sin(dlat/2)**2 + 
             np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * 
             np.sin(dlon/2)**2)
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
        return R * c

    def save(self, filepath):
        joblib.dump({
            'eps': self.eps,
            'min_samples': self.min_samples,
            'time_decay_factor': self.time_decay_factor,
            'max_radius': self.max_radius,
            'max_clusters_per_type': self.max_clusters_per_type
        }, filepath)
    
    @classmethod
    def load(cls, filepath):
        data = joblib.load(filepath)
        instance = cls()
        instance.eps = data.get('eps', 0.009)
        instance.min_samples = data.get('min_samples', 2)
        instance.time_decay_factor = data.get('time_decay_factor', 0.8)
        instance.max_radius = data.get('max_radius', 1.0)
        instance.max_clusters_per_type = data.get('max_clusters_per_type', 2)
        return instance

# Main execution block with improved error handling
if __name__ == '__main__':
    try:
        # Check if command line arguments exist
        if len(sys.argv) <= 1:
            print(json.dumps({'error': 'No command line arguments provided'}), file=sys.stderr)
            print(json.dumps([]))
            sys.exit(1)
        
        # Debug information
        print(f"Number of arguments: {len(sys.argv)}", file=sys.stderr)
        for i, arg in enumerate(sys.argv):
            print(f"Argument {i}: {arg[:100]}{'...' if len(arg) > 100 else ''}", file=sys.stderr)
        
        # Original code used sys.argv[2], but we should make sure it exists
        if len(sys.argv) > 1:
            try:
                # Try to parse the JSON directly
                crime_data = json.loads(sys.argv[1])
            except json.JSONDecodeError:
                # If that fails, check if it's a string representation of the filename
                try:
                    with open(sys.argv[1], 'r') as f:
                        crime_data = json.load(f)
                except:
                    # Final fallback - check if any argument contains valid JSON
                    crime_data = None
                    for arg in sys.argv[1:]:
                        try:
                            crime_data = json.loads(arg)
                            break
                        except:
                            continue
                    
                    if crime_data is None:
                        print(json.dumps({'error': 'Could not parse JSON from any argument'}), file=sys.stderr)
                        print(json.dumps([]))
                        sys.exit(1)
            
            predictor = CrimeHotspotPredictor()
            clusters = predictor.train(crime_data)
            print(json.dumps(clusters))
            sys.exit(0)
        else:
            print(json.dumps({'error': 'No JSON data provided'}), file=sys.stderr)
            print(json.dumps([]))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({'error': f"Unexpected error: {str(e)}"}), file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        print(json.dumps([]))
        sys.exit(1)