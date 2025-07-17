from flask import Flask, request, jsonify
import requests
from io import BytesIO
import base64

app = Flask(__name__)

# Image captioning model (BLIP)
CAPTION_API_URL = "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large"
# Text similarity model (Sentence-BERT)
SIMILARITY_API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
# Text classification model for crime detection
CRIME_API_URL = "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment"
HF_API_TOKEN = "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"  # ⚠️ Replace with a secure method for prod

headers = {
    "Authorization": f"Bearer {HF_API_TOKEN}"
}

@app.route('/analyze', methods=['POST'])
def analyze_image_text():
    try:
        data = request.get_json()
        image_url = data.get("image_url")
        user_description = data.get("description")
        
        if not image_url or not user_description:
            return jsonify({"error": "Missing image_url or description"}), 400
        
        # Fetch image from URL
        response = requests.get(image_url)
        if response.status_code != 200:
            return jsonify({"error": f"Failed to fetch image, status code: {response.status_code}"}), 502
        
        img_bytes = response.content
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        
        # Step 1: Generate image caption
        caption_payload = {
            "inputs": img_b64
        }
        
        caption_response = requests.post(CAPTION_API_URL, headers=headers, json=caption_payload)
        
        if caption_response.status_code != 200:
            return jsonify({"error": f"Image captioning failed, status code: {caption_response.status_code}"}), 502
        
        caption_result = caption_response.json()
        generated_caption = caption_result[0]["generated_text"] if isinstance(caption_result, list) else caption_result["generated_text"]
        
        # Step 2: Calculate similarity between generated caption and user description
        similarity_payload = {
            "inputs": {
                "source_sentence": generated_caption,
                "sentences": [user_description]
            }
        }
        
        similarity_response = requests.post(SIMILARITY_API_URL, headers=headers, json=similarity_payload)
        
        if similarity_response.status_code != 200:
            return jsonify({"error": f"Text similarity calculation failed, status code: {similarity_response.status_code}"}), 502
        
        similarity_score = similarity_response.json()[0]
        
        # Return results
        return jsonify({
            "generated_caption": generated_caption,
            "user_description": user_description,
            "similarity_score": similarity_score,
            "match_percentage": f"{similarity_score * 100:.2f}%"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/detect-crime', methods=['POST'])
def detect_crime():
    try:
        data = request.get_json()
        text = data.get("text")
        
        if not text:
            return jsonify({"error": "Missing text parameter"}), 400
        
        # Define crime-related categories for zero-shot classification
        crime_payload = {
            "inputs": text,
            "parameters": {
                "candidate_labels": [
                    "crime", "violence", "weapons", "drugs", "theft", "fraud", 
                    "harassment", "threatening", "illegal activity", "normal content"
                ]
            }
        }
        
        # Use a zero-shot classification model instead of sentiment analysis
        zero_shot_api = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"
        crime_response = requests.post(zero_shot_api, headers=headers, json=crime_payload)
        
        if crime_response.status_code != 200:
            return jsonify({"error": f"Crime detection failed, status code: {crime_response.status_code}"}), 502
        
        result = crime_response.json()
        
        # Process the results
        labels = result["labels"]
        scores = result["scores"]
        
        # Create a dictionary of label:score pairs
        crime_analysis = {labels[i]: scores[i] for i in range(len(labels))}
        
        # Determine if text is potentially criminal based on highest scoring category
        highest_category = labels[0]
        is_crime_related = highest_category != "normal content"
        crime_probability = sum([scores[i] for i in range(len(labels)) if labels[i] != "normal content"])
        
        return jsonify({
            "text": text,
            "is_crime_related": is_crime_related,
            "crime_probability": crime_probability,
            "highest_category": highest_category,
            "highest_score": scores[0],
            "detailed_analysis": crime_analysis
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001)