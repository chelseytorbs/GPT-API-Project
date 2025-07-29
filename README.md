# ChatGPT-Powered Ticket Management System

This project is a web-based interface that uses OpenAI’s ChatGPT API to manage, summarize, and prioritize software development tickets. The system ingests CSV files of tickets and displays AI-generated suggestions to help streamline productivity and reporting.

Features
🔍 AI Summaries: Generates brief, readable summaries for each ticket using the title and description.

💡 Task Suggestions: Recommends ways to resolve each ticket, including optional code or documentation links.

📌 Priority Guidance: Suggests which ticket to work on next based on priority and estimated completion time.

📁 CSV Upload: Accepts ticket data in CSV format with fields like Summary, Description, Priority, and Estimate.

🖥️ User Interface: Clean front-end displays ticket information and AI responses clearly.

Technologies
Python (Flask)

OpenAI API (GPT-4o-mini)

Pandas for CSV processing

HTML/CSS for UI

JavaScript (optional) if you're extending frontend interactivity

Setup Instructions
Clone the repository:

bash
Copy
Edit
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
Install dependencies:

bash
Copy
Edit
pip install -r requirements.txt
Add your OpenAI API key:

Create a file openai_secrets.py with:

python
Copy
Edit
SECRET_KEY = "your-openai-api-key"
Run the app:

bash
Copy
Edit
python app.py
Open your browser to http://localhost:5000
