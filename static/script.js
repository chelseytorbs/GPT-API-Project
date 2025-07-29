let selectedTicket = null; // Variable to store the selected ticket
let selectedTicketCard = null; // Variable to store the selected ticket card element
let filteredTickets = []; // Store the currently displayed (filtered) tickets

document.getElementById('upload-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('csvFile');
    const fileListDisplay = document.getElementById('file-list');
    const files = fileInput.files;

    if (files.length === 0) {
        alert("Please select at least one CSV file.");
        return;
    }

    const allTickets = []; // Array to hold all tickets from multiple files

    // Display selected files
    const fileNames = Array.from(files).map(file => file.name);
    fileListDisplay.textContent = fileNames.length > 3
        ? `${fileNames.slice(0, 3).join(', ')}... (${fileNames.length} files)`
        : fileNames.join(', ');

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload_csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`Error uploading ${file.name}: ${error.error}`);
                continue;
            }

            const tickets = await response.json();
            allTickets.push(...tickets);
            const ticketListContainer = document.getElementById('ticket-list');
            const assigneeFilter = document.getElementById('assignee-filter');

            ticketListContainer.innerHTML = ''; // Clear previous ticket list
            assigneeFilter.innerHTML = '<option value=""> Select Assignee </option>'; // Clear previous filter options

            // Process tickets and handle missing 'original_estimate'
            const processedTickets = tickets.map(ticket => {
                return {
                    ...ticket,
                    priority: ticket.priority || 'Low',  // Assign 'Low' as default for missing priorities
                    original_estimate: ticket.original_estimate || 'N/A'  // Assign 'N/A' for missing estimates
                };
            });

            filteredTickets = processedTickets;

            // Get unique assignees from the tickets
            const uniqueAssignees = [...new Set(processedTickets.map(ticket => ticket.name))];

            // Populate assignee filter dropdown
            uniqueAssignees.forEach(assignee => {
                const option = document.createElement('option');
                option.value = assignee;
                option.textContent = assignee;
                assigneeFilter.appendChild(option);
            });

            // Display all tickets initially
            displayTickets(filteredTickets);

            // Filter tickets by assignee
            assigneeFilter.addEventListener('change', (event) => {
                const selectedAssignee = event.target.value;
                if (selectedAssignee === '') {
                    displayTickets(filteredTickets);
                } else {
                    const filteredByAssignee = filteredTickets.filter(ticket => ticket.name === selectedAssignee);
                    displayTickets(filteredByAssignee);
                }
            });

            // Clear file list display after upload
            setTimeout(() => {
                fileListDisplay.textContent = ''; // Clear message after a delay
            }, 2000);

        } catch (error) {
            console.error('Error uploading CSV:', error);
            alert('Error uploading CSV.');
        }
    }
});


// Function to display tickets (you can reuse your existing code here)
const displayTickets = (ticketsToDisplay, sortCriteria = null) => {
    const ticketListContainer = document.getElementById('ticket-list');
    ticketListContainer.innerHTML = ''; // Clear the list first

    // Create and add the "Select All" checkbox
    const selectAllContainer = document.createElement('div');
    selectAllContainer.classList.add('select-all-container');

    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-checkbox';

    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = 'select-all-checkbox';
    selectAllLabel.textContent = 'Select All Tickets';

    selectAllContainer.appendChild(selectAllCheckbox);
    selectAllContainer.appendChild(selectAllLabel);
    ticketListContainer.appendChild(selectAllContainer);

    // Event listener for "Select All" checkbox
    selectAllCheckbox.addEventListener('change', () => {
        const checkboxes = document.querySelectorAll('.ticket-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    });
    
    ticketsToDisplay.forEach(ticket => {
        const ticketCard = document.createElement('div');
        ticketCard.classList.add('ticket-card');
        ticketCard.setAttribute('data-ticket-id', ticket.TIC);

        // Checkbox for ticket selection
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('ticket-checkbox');
        checkbox.value = ticket.TIC;

        // Synchronize card click and checkbox
        ticketCard.addEventListener('click', (event) => {
            // Prevent triggering when clicking directly on the checkbox
            if (event.target === checkbox) return;

            selectedTicket = ticket; // Store the selected ticket

            // Remove 'selected' class from the previously selected ticket
            if (selectedTicketCard) {
                selectedTicketCard.classList.remove('selected');
            }

            // Add 'selected' class to the current ticket card
            ticketCard.classList.add('selected');
            selectedTicketCard = ticketCard;

            // Toggle the checkbox state
            checkbox.checked = !checkbox.checked;

            console.log(`Selected Ticket: ${ticket.title}, Checkbox Checked: ${checkbox.checked}`);
        });

        // Ensure clicking the checkbox directly only affects its state
        checkbox.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent the click event from propagating to the card
        });

        const ticketInfo = document.createElement('div');
        ticketInfo.classList.add('ticket-info');

        const ticketTitle = document.createElement('p');
        ticketTitle.classList.add('ticket-title');
        ticketTitle.textContent = ticket.title && ticket.title !== 'nan' ? ticket.title : '';

        const ticketTIC = document.createElement('p');
        ticketTIC.classList.add('ticket-detail');
        ticketTIC.textContent = `TIC: ${ticket.TIC}`;

        const ticketPriority = document.createElement('p');
        ticketPriority.classList.add('ticket-detail');
        ticketPriority.textContent = `Priority: ${ticket.priority && ticket.priority !== 'nan' ? ticket.priority : 'Low'}`;

        const ticketEstimate = document.createElement('p');
        ticketEstimate.classList.add('ticket-detail');
        ticketEstimate.textContent = `Estimate: ${ticket.original_estimate}`;

        const ticketAssignee = document.createElement('p');
        ticketAssignee.classList.add('ticket-detail');
        ticketAssignee.textContent = `Assigned to: ${ticket.name}`;

        const ticketDescription = document.createElement('p');
        ticketDescription.classList.add('ticket-detail');
        ticketDescription.textContent = ticket.description && ticket.description !== 'nan' ? ticket.description : '';
        
        // Create Remove Button
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-ticket-button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent triggering the ticket selection
            removeTicket(ticket.TIC);
        });

        ticketInfo.appendChild(ticketTitle);
        ticketInfo.appendChild(ticketTIC);
        ticketInfo.appendChild(ticketPriority);
        ticketInfo.appendChild(ticketEstimate);
        ticketInfo.appendChild(ticketAssignee);
        ticketCard.appendChild(checkbox); // Add checkbox to ticket card
        ticketCard.appendChild(ticketInfo);
        ticketCard.appendChild(removeButton);


        ticketListContainer.appendChild(ticketCard);
    });
};

document.getElementById('export-selected-button').addEventListener('click', () => {
    // Get all selected checkboxes
    const selectedCheckboxes = document.querySelectorAll('.ticket-checkbox:checked');

    // Check if no tickets are selected
    if (selectedCheckboxes.length === 0) {
        alert("Please select at least one ticket to export.");
        return;
    }

    // Extract the selected tickets based on their TIC values
    const selectedTickets = Array.from(selectedCheckboxes).map(checkbox =>
        filteredTickets.find(ticket => ticket.TIC === checkbox.value)
    );

    // Sort the selected tickets by estimate
    const sortedTickets = selectedTickets.sort((a, b) => {
        const estimateToHours = (estimate) => {
            const parts = estimate.match(/(\d+)d:(\d+)h/);
            const days = parseInt(parts[1], 10) || 0;
            const hours = parseInt(parts[2], 10) || 0;
            return (days * 24) + hours;
        };

        const estimateA = estimateToHours(a.original_estimate);
        const estimateB = estimateToHours(b.original_estimate);
        return estimateA - estimateB;
    });

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Get the current date and time
    const now = new Date();
    const currentDate = now.toLocaleDateString(); // Format: MM/DD/YYYY
    const currentTime = now.toLocaleTimeString(); // Format: HH:MM:SS AM/PM
 
    // Title
    doc.setFont('Newsreader');
    doc.setFontSize(30);
    doc.text('TicketAssist', 10, 20);

    const logoBase64 = 'data:image/png;base64,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'; // Replace with your Base64-encoded image
    doc.addImage(logoBase64, 'PNG', 65, 3.5, 25, 25); // Adjust dimensions as needed

    // Set font size for ticket details
    doc.setFontSize(12);
    doc.text(`${currentDate} at ${currentTime}`, 10, 30);

    // Add each ticket to the PDF
    let yPosition = 40;
    const lineHeight = 15; // Height between each line of text
    const ticketSpacing = 15; // Space between different tickets

    sortedTickets.forEach(ticket => {
        // Ticket Title
        doc.text(`TIC: ${ticket.TIC}`, 10, yPosition);
        yPosition += 5; // Move to the next line

        // Ticket Priority
        doc.text(`Priority: ${ticket.priority}`, 10, yPosition);
        yPosition += 5;

        // Ticket Estimate
        doc.text(`Estimate: ${ticket.original_estimate}`, 10, yPosition);
        yPosition += 5;

        // Ticket Assignee
        doc.text(`Assigned to: ${ticket.name}`, 10, yPosition);
        yPosition += 5;

        // Ticket Description
        doc.text(`Description: ${ticket.description}`, 10, yPosition);
        yPosition += lineHeight;

        // Add space between tickets
        yPosition += ticketSpacing;

        // Add a new page if the Y position exceeds the page height
        if (yPosition > 270) { // Adjust for bottom margin
            doc.addPage();
            yPosition = 20; // Reset the Y position for the new page
        }
    });

    // Save the PDF
    doc.save(`tickets_${currentDate}_${currentTime}.pdf`);
});

function openTab(tabName) {
    // Hide all tab contents
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.style.display = 'none');

    // Remove active class from all tab buttons
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));

    // Show the selected tab content and mark the tab button as active
    document.getElementById(tabName + '-tab').style.display = 'block';
    document.querySelector(`.tab-button[onclick="openTab('${tabName}')"]`).classList.add('active');
}


function formatMarkdownOutput(markdownText, outputElementId) {
    // Helper function to escape HTML for code blocks
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, (char) => {
            const escapeChars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            };
            return escapeChars[char];
        });
    }

    // Replace Markdown headers (###)
    markdownText = markdownText.replace(/^###\s(.+)/gm, '<h3>$1</h3>');

    // Replace bold text (**bold**)
    markdownText = markdownText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Replace italic text (*italic*)
    markdownText = markdownText.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Replace inline code (`code`)
    markdownText = markdownText.replace(/`(.+?)`/g, '<code>$1</code>');

    // Replace Markdown-style links ([text](url))
    markdownText = markdownText.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Replace text wrapped in triple backticks (```) with a code block
    const codeBlockRegex = /```([\s\S]*?)```/g;
    markdownText = markdownText.replace(codeBlockRegex, (match, code) => {
        return `<pre><code>${escapeHTML(code)}</code></pre>`;
    });

    // Insert the processed HTML into the specified output container
    const outputElement = document.getElementById(outputElementId);
    if (outputElement) {
        outputElement.innerHTML = markdownText;
    }
}

// Helper function to escape HTML characters for code blocks
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (char) => {
        const escapeChars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapeChars[char];
    });
}

function removeTicket(ticketId) {
    // Confirm before removing the ticket
    const confirmation = confirm(`Are you sure you want to remove Ticket ${ticketId}?`);
    if (!confirmation) return;

    // Remove ticket from the filteredTickets array
    filteredTickets = filteredTickets.filter(ticket => ticket.TIC !== ticketId);

    // Remove ticket from the DOM
    const ticketCard = document.querySelector(`[data-ticket-id="${ticketId}"]`);
    if (ticketCard) {
        ticketCard.remove();
    }

    console.log(`Ticket ${ticketId} removed successfully.`);
}


// Helper function to parse original_estimate into hours
function parseEstimate(estimate) {
    if (!estimate || estimate === 'N/A') return Infinity; // Treat "N/A" as the largest value
    const match = estimate.match(/(\d+)d:*(\d+)?h?/); // Match "Xd:Yh" or "Xd"
    const days = parseInt(match?.[1] || 0, 10);
    const hours = parseInt(match?.[2] || 0, 10);
    return days * 24 + hours; // Convert to total hours
}

const sortDisplayedTickets = (tickets, sortCriteria) => {
    // console.log(tickets)
    if (sortCriteria === 'priority') {
        const priorityOrder = {
            "nan": 7,
            "Low": 6,
            "Medium": 5,
            "Medium (When convenient)": 4,
            "High": 3,
            "High (Soon)": 2,
            "Critical": 1,
            "Critical (ASAP!)": 0,
        };
        tickets.sort((a, b) => {
            const priorityA = priorityOrder[a.priority || 'nan'];
            const priorityB = priorityOrder[b.priority || 'nan'];
            return priorityA - priorityB;
        });
    } else if (sortCriteria === 'original_estimate') {
        tickets.sort((a, b) => {
            const estimateA = parseEstimate(a.original_estimate);
            const estimateB = parseEstimate(b.original_estimate);
            return estimateA - estimateB;
        });
    }
    return tickets;
};

// Sorting Dropdown Event Listener
document.getElementById('sort-options').addEventListener('change', (event) => {
    const sortCriteria = event.target.value; // Get selected sorting criteria
    console.log("Selected Sort Criteria:", sortCriteria);

    const sortedTickets = sortDisplayedTickets([...filteredTickets], sortCriteria); // Clone filteredTickets
    displayTickets(sortedTickets); // Display sorted tickets
});


// Set initial tab to be visible (optional)
document.addEventListener('DOMContentLoaded', () => {
    openTab('summary'); // Show the summary tab by default
});

// Update to automatically switch tabs on button click (if desired)
document.getElementById('summarize-button').addEventListener('click', async () => {
    openTab('summary'); // Switch to the Summary tab
    // existing summarize code...
});

document.getElementById('suggest-button').addEventListener('click', async () => {
    openTab('suggestion'); // Switch to the Suggestion tab
    // existing suggestion code...
});

document.getElementById('recommend-button').addEventListener('click', async () => {
    openTab('recommendation'); // Switch to the Recommendation tab
    // existing recommendation code...
});

function showSpinner() {
    document.getElementById('loading-spinner').style.display = 'block';
}

function hideSpinner() {
    document.getElementById('loading-spinner').style.display = 'none';
}

document.getElementById('begin-button').addEventListener('click', () => {
    // Ensure the ticket interface starts off-screen
    document.querySelector('.main-container').classList.remove('slide-out');
    document.querySelector('.main-container').classList.add('slide-in');

    // Add slide-out class to the landing page
    document.getElementById('landing-page').classList.add('slide-out');

    // After the animation completes, hide the landing page
    setTimeout(() => {
        document.getElementById('landing-page').classList.remove('slide-in'); // Reset landing page position
    }, 500); // Match this timeout to the CSS transition duration
});

document.getElementById('csvFile').addEventListener('change', (event) => {
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = ''; // Clear previous file names

    const files = event.target.files; // Get the selected files
    const maxFilesToShow = 3; // Maximum number of file names to show
    const totalFiles = files.length;

    if (totalFiles > 0) {
        const fileNames = Array.from(files).map((file) => file.name); // Get file names
        const displayedFiles = fileNames.slice(0, maxFilesToShow); // Show only the first few
        const remainingCount = totalFiles - maxFilesToShow;

        // Display file names and add ellipsis if more files are present
        fileList.textContent = displayedFiles.join(', ');
        if (remainingCount > 0) {
            const moreSpan = document.createElement('span');
            moreSpan.className = 'more-files';
            moreSpan.textContent = ` +${remainingCount}...`;
            fileList.appendChild(moreSpan); // Add the ellipsis span
        }
    } else {
        fileList.textContent = 'No files selected.'; // Default message
    }
});

// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOM fully loaded and parsed.');

//     // Initialize buttons and event listeners
//     const summarizeButton = document.getElementById('summarize-button');
//     const suggestButton = document.getElementById('suggest-button');
//     const recommendButton = document.getElementById('recommend-button');

//     if (summarizeButton) {
//         summarizeButton.addEventListener('click', async () => {
//             openTab('summary');
//             console.log('Summarize button clicked.');
//             // Add your summarize logic here
//         });
//     } else {
//         console.error('Summarize button not found.');
//     }

//     if (suggestButton) {
//         suggestButton.addEventListener('click', async () => {
//             openTab('suggestion');
//             console.log('Suggest button clicked.');
//             // Add your suggestion logic here
//         });
//     } else {
//         console.error('Suggest button not found.');
//     }

//     if (recommendButton) {
//         recommendButton.addEventListener('click', async () => {
//             openTab('recommendation');
//             console.log('Recommend button clicked.');
//             // Add your recommendation logic here
//         });
//     } else {
//         console.error('Recommend button not found.');
//     }

//     // Initialize tabs
//     const tabs = document.querySelectorAll('.tab-content');
//     tabs.forEach(tab => tab.classList.remove('active'));
//     document.getElementById('summary-tab').classList.add('active');
// });

// // Function to export tickets as PDF
// function exportTicketsAsPDF(tickets) {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();

//     // Title
//     doc.setFontSize(18);
//     doc.text('Ticket Report', 10, 10);

//     let yPosition = 20;

//     tickets.forEach(ticket => {
//         // Ticket details
//         doc.setFontSize(12);
//         doc.text(`TIC: ${ticket.TIC}`, 10, yPosition);
//         yPosition += 6;
//         doc.text(`Title: ${ticket.title}`, 10, yPosition);
//         yPosition += 6;
//         doc.text(`Priority: ${ticket.priority}`, 10, yPosition);
//         yPosition += 6;
//         doc.text(`Estimate: ${ticket.original_estimate}`, 10, yPosition);
//         yPosition += 6;
//         doc.text(`Assignee: ${ticket.name}`, 10, yPosition);
//         yPosition += 10; // Add spacing between tickets

//         // Add new page if needed
//         if (yPosition > 270) {
//             doc.addPage();
//             yPosition = 20; // Reset position
//         }
//     });

//     // Save the PDF
//     doc.save('selected_tickets.pdf');
// }


function navigateToLandingPage() {
    // Redirect the user to the landing page
    document.querySelector('.main-container').classList.add('slide-out');

    // Slide in the landing page
    setTimeout(() => {
        // Reset ticket interface classes
        document.querySelector('.main-container').classList.remove('slide-in');
        document.querySelector('.main-container').classList.remove('slide-out');

        // Show and reset landing page classes
        document.getElementById('landing-page').classList.remove('slide-out');
        document.getElementById('landing-page').classList.add('slide-in');
    }, 500); // Match this timeout to the CSS transition duration
}

