# PDF Highlighter 
I chose to implement a feature that would automatically upload the PDF into the database using sqlite locally, by converting it to a base64 string first. My Waterloo email is a387wang@uwaterloo.ca

## Set up process:
- Clone the repository
- Install dependencies: pnpm install
- Run the development server: pnpm run dev
- Open http://localhost:3000 in your browser
- A new SQLite table will be automatically if it did not yet exist to store the PDF

## My thought process:
- The new feature should follow the existing design. After reviewing and understanding the existing code, I drew a diagram(see figure 1.1) for the existing design and implemented the feature as described below.
- First I tried to handle the backend functions by creating a new table in sqlite to store the pdf files.Each PDF uploaded is assigned a primary key, its filename, so that if the user were to upload the same document twice, the duplicate document would not take up unnecessary space. This is assuming that no two users are going to upload the same doc.
- Also created a new set of routes for sending and retrieving PDF files, similar to the routes used to send and retrieve highlighting.
- A savePdf function in sqliteUtilPdf inserts the PDF data into the database using an SQL statement. I actually realized later that I shouldn’t have created a separate utils file and class for the PDF database operations as sqliteUtils was meant to handle all database operations.
- After the backend function is ready, I started working on the front end by modifying the handleFileUpload() function in App.tsx, first converting the file into a base64 string using the FileReader: readAsDataURL() method before sending the converted PDF file as a string, from the client to the server using the Fetch API with the “POST” method.


## Challenges:
- One major challenge I faced was my unfamiliarity with the application’s code and file structures.
  - To overcome this, I started by using this application as an end user, uploading a few files, downloading a few sets of highlights. This allowed me to quickly figure out what the application was designed to do.
  - I also downloaded DB Browser, which allows me to visualize the database to which the highlights are saved.
  - I used VSCode’s "Find all references" and "Go to Definition" tools to quickly navigate function calls and returns.
  - I also added several console.log statements across the entire application to help me visualize and keep track of the status, value, and type of various variables and objects. This was key to allowing me to understand the journey of data from the client to the server and to the database
  - During the analysis process, I created a design diagram to help myself visualize the existing design structure.
- Another major challenge I faced was my unfamiliarity with several of the libraries, classes, and objects used throughout this application.
  - The way I overcame this was through the thorough studying of their documentation and uses on the web. One thing that really helped me figure these out quickly was avoiding the temptation to take shortcuts during my reading. It is a lot faster to read through the basics than it is to skip those parts and then later trying to figure them out on your own.

![REACT code structure (2) (1)](https://github.com/user-attachments/assets/2ba5d2a3-4b97-4e47-9c66-73674d28edf3)
Figure 1.1

## Thoughts about optional features:
After reading over the problem, I found all of the possible features to be extremely interesting, and given more time, I would definitely have given all of them a try. Here’s a short description of how I might try to tackle some of them:

## How to handle multiple uploads
Problem: The app object is designed to work with current upload and doesn’t remember what was uploaded previously. Existing sqlite table stores highlights based on pdfId, not by user session.
The solution is a Model change
- Add an array to the app object to store pdfIds uploaded by this user session
- const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
- const [pdfIds, setPdfIds] = useState<Array<string>>([]);

## Controller code change
- Modify search button to loop thru pdfIds, load the pdf from sqlite DB, execute existing handleSearch (this will automatically update search results into sqlite)
- At the end of search, load all highlights including from previous uploads
- The sidebar should automatically list out all highlights from different docs (need to sort/group by doc)
- When click on the highlight entry in sidebar, modify the code to load pdf from sqlite if it’s not currently loaded, then update the model (the pdfUrl and pdfOcrUrl in app.tsx), pdf viewer should change automatically to show the new doc. Rest of the code can continue as is.

## How to test pdfUploaded in sqlite
- I was going to create a retrieve function to test my uploaded pdfs from DB.

