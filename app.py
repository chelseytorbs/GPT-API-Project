from flask import Flask, request, jsonify, render_template
import pandas as pd
import os
import openai
import textwrap

# openai.api_key = "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"
from openai import OpenAI

import openai_secrets

client = OpenAI(api_key=openai_secrets.SECRET_KEY)
app = Flask(__name__)

# Set up a directory for uploaded files
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Set up OpenAI API key
openai.api_key = 'YOUR_API_KEY'

# Store tickets globally (in memory for simplicity)
stored_tickets = []

# Serve the HTML file at the root endpoint
def seconds_to_days_hours(seconds):
    days = seconds // 86400  # Calculate number of full days
    hours = (seconds % 86400) // 3600  # Calculate remaining hours
    return f"{days}d:{hours}h"

def generate_summary(title, description):
    try:
        prompt_for_summary = f"Summarize in 1-2 sentences of this ticket using either title or description, or both. Title: {title}, Description: {description}."
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt_for_summary}]
        )
        summary = response.choices[0].message.content  
        paragraphs = summary.split('\n')
        wrapped_paragraphs = [textwrap.fill(paragraph, width=100) for paragraph in paragraphs]
        wrapped_summary = '\n'.join(wrapped_paragraphs)
        return wrapped_summary
    except Exception as e:
        return "Summary unavailable"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    # Check if any files were uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    files = request.files.getlist('file')  # Get list of files
    if not files or files[0].filename == '':
        return jsonify({"error": "No selected file(s)"}), 400

    all_new_tickets = []  # List to hold all tickets from uploaded files

    # Process each file
    for file in files:
        # Save each file to the upload folder
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        # Read the CSV file and filter columns
        try:
            df = pd.read_csv(filepath, encoding='ISO-8859-1')
            filtered_df = df[['Summary', 'Assignee', 'Custom field (Priority)', 'Description', 'Issue key', 'Original estimate']].copy()
            
            # Rename columns for easier access
            filtered_df.rename(columns={
                'Summary': 'title',
                'Assignee': 'name',
                'Custom field (Priority)': 'priority',
                'Description': 'description',
                'Issue key': 'TIC',
                'Original estimate': 'original_estimate'
            }, inplace=True)

            # Data cleaning and transformation
            filtered_df['TIC'] = filtered_df['TIC'].astype(str)
            filtered_df['priority'] = filtered_df['priority'].astype(str).fillna('Low')
            filtered_df['title'] = filtered_df['title'].astype(str).fillna('No title provided.')
            filtered_df['description'] = filtered_df['description'].astype(str).fillna('No description provided.')
            filtered_df['original_estimate'] = filtered_df['original_estimate'].fillna(0).apply(lambda x: seconds_to_days_hours(int(x)))
            filtered_df['description'] = filtered_df.apply(lambda row: generate_summary(row['title'], row['description']), axis=1)

            # Convert filtered dataframe to list of dictionaries and add to all_new_tickets
            new_tickets = filtered_df.to_dict(orient='records')
            all_new_tickets.extend(new_tickets)

        except KeyError:
            return jsonify({"error": f"Required columns not found in {file.filename}"}), 400

    # Append unique new tickets to the global stored_tickets list
    global stored_tickets
    existing_tic_numbers = {ticket['TIC'] for ticket in stored_tickets}
    for ticket in all_new_tickets:
        if ticket['TIC'] not in existing_tic_numbers:
            stored_tickets.append(ticket)

    # Send updated stored tickets as JSON response
    return jsonify(stored_tickets)

@app.route('/summarize_ticket', methods=['POST'])
def summarize_ticket():
    # Get the ticket TIC number from the request
    tic_number = request.json.get('TIC')
    if not tic_number:
        return jsonify({"error": "No TIC number provided"}), 400

    # Find the ticket by TIC number
    ticket = next((t for t in stored_tickets if t['TIC'] == tic_number), None)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Generate a summary using OpenAI
    try:
        prompt_for_summary = f"Generate a summary of this ticket using either title or description, or both. Title: {ticket['title']}, Description: {ticket['description']}."
        response_summary = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt_for_summary}]
        )
        output_summary = response_summary.choices[0].message.content  

        # Wrap the output summary for better formatting
        paragraphs = output_summary.split('\n')
        wrapped_paragraphs = [textwrap.fill(paragraph, width=100) for paragraph in paragraphs]
        wrapped_summary = '\n'.join(wrapped_paragraphs)

        return jsonify({
            "TIC": ticket['TIC'],
            "title": ticket['title'],
            "summary": output_summary
        })
    except Exception as e:
        return jsonify({"error": f"Failed to generate summary: {str(e)}"}), 500

@app.route('/suggest_ticket', methods=['POST'])
def suggest_ticket():
    # Get the ticket TIC number from the request
    tic_number = request.json.get('TIC')
    if not tic_number:
        return jsonify({"error": "No TIC number provided"}), 400

    # Find the ticket by TIC number
    ticket = next((t for t in stored_tickets if t['TIC'] == tic_number), None)
    if not ticket:
        return jsonify({"error": "Ticket not found"}), 404

    # Generate a suggestion using OpenAI
    try:
        prompt_for_suggestion = (f"Provide suggestions on how I can complete this ticket. Title:{ticket['title']}, " + 
                         f"Description:{ticket['description']}. Provide code snippet if necessary and/or " + 
                         f"links to relevant documentation based on the content of the ticket. Do not provide code snippet if the ticket does not require it.")
        response_suggestion = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt_for_suggestion}]
        )
        output_suggestion = response_suggestion.choices[0].message.content  
        paragraphs_sugg = output_suggestion.split('\n')
        wrapped_paragraphs_sugg = [textwrap.fill(paragraph_sugg, width=100) for paragraph_sugg in paragraphs_sugg]
        wrapped_suggestion = '\n'.join(wrapped_paragraphs_sugg)
        return jsonify({
            "TIC": ticket['TIC'],
            "title": ticket['title'],
            "suggestion": output_suggestion
        })
    except Exception as e:
        return jsonify({"error": f"Failed to generate suggestion: {str(e)}"}), 500


@app.route('/recommend_ticket', methods=['POST'])
def recommend_ticket():
    
    data = request.json
    filtered_tickets = data.get('tickets')

    if not filtered_tickets:
        return jsonify({"error": "No tickets available for recommendation"}), 400

    # Define priority map for sorting
    priority_map = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}

    # Sort tickets by priority and original estimate
    sorted_tickets = sorted(filtered_tickets, key=lambda x: (
        priority_map.get(x['priority'], float('inf')),
        int(x['original_estimate']) if str(x['original_estimate']).isdigit() else float('inf')
    ))

    # Get the top priority ticket
    recommended_ticket = sorted_tickets[0]

    # Debugging: Log the recommended ticket
    print("Recommended Ticket:", recommended_ticket)

    # Generate a summary using OpenAI
    try:
        # tickets_info = "\n".join(
        # f"TIC: {tick['TIC']}, Title: {tick['title']}, Description: {tick['description']}"
        #     for tick in stored_tickets)

        prompt_for_recommendation = (f"Which ticket should I work on next based on task type and how fast I " + 
                            f"can get it done. Here are the tickets to choose from:"
                            f"Ticket details:\nTitle: {recommended_ticket['title']}\n"
                            f"Description: {recommended_ticket['description']}\n"
                            f"Priority: {recommended_ticket['priority']}\n"
                            f"Original Estimate: {recommended_ticket['original_estimate']}")
        
        response_recommend = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt_for_recommendation}]
        )
        output_recommend = response_recommend.choices[0].message.content 
        paragraphs_rec = output_recommend.split('\n')
        wrapped_paragraphs_rec = [textwrap.fill(paragraph_rec, width=100) for paragraph_rec in paragraphs_rec]
        wrapped_recommend = '\n'.join(wrapped_paragraphs_rec)

        return jsonify({
            "TIC": recommended_ticket['TIC'],
            "title": recommended_ticket['title'],
            "recommendation": output_recommend
        })
    except Exception as e:
        return jsonify({"error": f"Failed to generate recommendation: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
