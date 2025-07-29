from flask import Flask
from flask import render_template
from flask import Response, request, jsonify
app = Flask(__name__)

import os
from openai import OpenAI

import secrets_key

client = OpenAI(api_key=secrets_key.SECRET_KEY)

tickets = [
    {
        "TIC": 383,
        "title": "Compile List of All Software Licenses",
        "description": "Compile a list of all softwares used by SF and" + 
            "their licenses, including usage start dates, license duration," + 
            "and etc. available info.*Task Steps:** Identify all softwares, " +
            "tools, platforms, and devices used by SF. Compile all available " + 
            "license info on everything identified",
        "priority": "High",
        "original_estimate": "54000",
        "name": "John"
    },
    {
        "TIC": 381,
        "title": "Refactor Documentation into Several Pages",
        "description": "Update the [Processing Technical Workflow] documentation " +
            "to exist in several pages, rather than one, to improve page loading and " +
            "functionality, as well as general readability (such a massive wall of " +
            "text as we have now can be difficult to sift through to find what " +
            "you're really looking for, and the current size of the document is " +
            "making documentation incredibly laggy, at least on my end).",
        "priority": "Medium",
        "original_estimate": "144000",
        "name": "John"
    },
    {
        "TIC": 380,
        "title": "Fix Get PDF Report Toolbox Destroying Airport Full Image",
        "description": "The 'Get PDF Report' tool fails to include the " +
        "actual full airport screenshot image in the output report when " +
        "ran.",
        "priority": "Critical",
        "original_estimate": "129600",
        "name": "Derick"
    },
    {
        "TIC": 380,
        "title": "Fix Get PDF Report Toolbox Destroying Airport Full Image",
        "description": "The 'Get PDF Report' tool fails to include the " +
        "actual full airport screenshot image in the output report when " +
        "ran.",
        "priority": "Critical",
        "original_estimate": "129600",
        "name": "John"
    },
    {
        "TIC": 380,
        "title": "Fix Get PDF Report Toolbox Destroying Airport Full Image",
        "description": "The 'Get PDF Report' tool fails to include the " +
        "actual full airport screenshot image in the output report when " +
        "ran.",
        "priority": "Critical",
        "original_estimate": "129600",
        "name": "Derick"
    }
]

for ticket in tickets:
    response = OpenAI.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an AI assistant providing ticket summaries and suggestions."},
            {"role": "user", "content": f"Ticket Description: {ticket['description']}, Severity: {ticket['severity']}, Time of Completion: {ticket['time_of_completion']}, Name: {ticket['name']}"}
        ]
    )
    summary = response['choices'][0]['message']['content']
    print(f"Ticket {ticket['id']} Summary:\n{summary}\n")

def recommend_ticket(tickets):
    # Sort tickets by severity and time of completion
    tickets.sort(key=lambda x: (x['severity'], x['time_of_completion']))
    return tickets[0]  # Recommend the highest priority ticket

recommended_ticket = recommend_ticket(tickets)
print(f"Recommended Ticket:\n{recommended_ticket}\n")