# Feature Implemented: Implementation of Unit Tests

I chose to implement the last option and write unit tests for this applciation since this was something I havent tried before and was fairly unfamilar with, especially compared to the other options. I thought this would be a great oppurtunity for me to learn something new that I could especially implement in my future projects. The goal is to ensure the robustness of the codebase, enabling detection of changes in the user interface (UI) or application programming interface (API) seamlessly.

# Approach

To tackle the challenge, I first cloned the provided repository from GitHub. I took time to familiarize myself with the existing codebase, focusing on understanding the structure of components and their interactions. I decided to implement unit tests for several key components, including KeywordSearch, PdfUploader, Sidebar, and HighlightPopup.

# Setting Up Testing Environment

I set up the testing environment using Jest, ensuring compatibility with the existing code. I also integrated Babel to transpile the code, allowing me to utilize modern JavaScript features and React syntax. This setup facilitated writing clear and efficient test cases.

# Creating Unit Tests:

For each component, I created test cases to cover the following scenarios:

Rendering: Verifying that components render correctly based on different states (e.g., with or without props).
User Interactions: Testing how the components behave in response to user actions, such as clicking buttons or changing input fields.
Function Calls: Ensuring that essential functions (like callbacks for handling uploads and highlights) are called when expected.
Conditional Rendering: Checking that the components appropriately render different elements based on props or internal state.
Challenges Faced
While developing the unit tests, I encountered several challenges:

# Understanding Component Behavior:

Initially, comprehending the existing logic and flow of each component was daunting. To overcome this, I utilized console logs and debug tools to trace component rendering and prop changes. This approach clarified how different states impacted the UI.

# Mocking Functions:

I had to mock functions effectively, especially when dealing with props that required callbacks. Implementing jest.fn() allowed me to create mock functions, ensuring that the components interacted correctly with these props. Testing interactions relied heavily on these mocks to assert their invocations and parameters.

# Managing State and Effects:

Some components relied on internal state or side effects, which required careful handling. I learned to use beforeEach for resetting states and props, ensuring that tests were isolated and reliable. This approach helped maintain the integrity of each test case.

# Strengths Demonstrated

Through this challenge, I demonstrated several strengths:

Adaptability: I quickly adapted to the existing codebase, leveraging my familiarity with React and unit testing to implement effective test cases.
Problem-Solving Skills: I approached challenges with a solution-oriented mindset, using various debugging techniques to understand component behaviors.
Attention to Detail: Crafting test cases required meticulous attention to detail, ensuring that all scenarios were accounted for and tested rigorously.

# Issue Encountered with Test Compilation

Despite my efforts in creating the unit tests, I encountered a significant challenge when running the test suite using the command pnpm test. The tests compiled but ultimately failed to execute due to several errors related to the Jest configuration and the handling of specific module imports within the existing codebase.

Upon investigation, I realized that there were compatibility issues with certain dependencies and the Jest testing framework. These issues arose primarily from differences in how modules were being imported and utilized across the project, which could lead to inconsistencies in the test execution environment.

To address this challenge, I recognized the importance of thorough documentation of the project's dependencies and configurations. Had I dedicated more time to reviewing the Jest configuration file and ensuring compatibility with all imported modules, I could have preemptively identified and resolved these errors.

# Steps for Resolution

Moving forward, I would implement the following strategies to overcome such challenges in the future:

Incremental Testing: I would adopt an incremental approach to testing by running individual test files initially. This method would help identify specific components or tests that may be causing issues and allow for targeted troubleshooting.

Enhanced Configuration Review: Prior to writing tests, I would carefully review the testing framework's documentation and the existing project configuration. Ensuring that all modules are correctly configured for Jest would minimize potential conflicts during test execution.

Collaboration and Support: If I encountered persistent issues, I would not hesitate to seek assistance from colleagues or utilize online communities to gain insights into similar challenges faced by others. Leveraging shared knowledge could provide alternative solutions or workarounds that I may not have considered.

While the errors presented a setback in my testing efforts, they also offered valuable learning opportunities regarding project configurations and the complexities of testing in a collaborative environment. 

# PDF Highlighter 

## Project Overview

This project is a PDF viewer and keyword search application developed as part of the Adanomad Tech Consulting Challenge. It allows users to upload PDF documents, view them in a web browser, search for keywords, and highlight matching text.

## Features

- PDF document upload and display
- Page navigation (next, previous, jump to specific page)
- Zoom in/out functionality
- Document information display (total pages, current page)
- Keyword search across the entire PDF
- Text highlighting for search matches
- Sidebar for search results and navigation
- Responsive design for various screen sizes
- Persistent storage of highlights using SQLite or Supabase

## Technologies Used

- Next.js
- React 
- TypeScript
- react-pdf library for PDF rendering
- Tailwind CSS for stylinge
- SQLite for local highlight storage
- Supabase for cloud-based highlight storage (optional)

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Run the development server: `pnpm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `app/page.js`: Main entry point of the application
- `app/components/`: React components for various parts of the application
- `app/utils/`: Utility functions for PDF processing and highlight storage
- `app/styles/`: CSS files for styling
- `app/api/`: API routes for handling highlight operations

## Key Components

- `App.tsx`: Core application component
- `PdfViewer.tsx`: Handles PDF rendering and navigation
- `KeywordSearch.tsx`: Manages keyword search functionality
- `HighlightPopup.tsx`: Displays information about highlighted text
- `Sidebar.tsx`: Shows search results and navigation options
- `highlightStorage.ts`: Manages highlight storage operations
- `sqliteUtils.ts`: Handles SQLite database operations

## Features

- Has a highlight storage system supporting both SQLite and Supabase
- API routes for creating, retrieving, updating, and deleting highlights
- User authentication and document permissions (currently disabled)
- Export/import as JSON functionality for highlights
- Scroll the sidebar highlighted area into view across different PDFs. 


## Future Improvements

- Implement annotation tools (e.g., freehand drawing, text notes)
- Add support for multiple document search
- Pre-process batch PDFs for quicker highlights
- Enhance mobile responsiveness for better small-screen experience
- Optimize performance for large PDF files
- Upload the PDF into the database.

## License

[MIT License](https://opensource.org/licenses/MIT)

## Acknowledgements

- [Next.js](https://nextjs.org/) for the React framework
- [SQLite](https://www.sqlite.org/) for local database storage
- [Supabase](https://supabase.io/) for cloud database capabilities
- [react-pdf](https://github.com/wojtekmaj/react-pdf) for PDF rendering capabilities
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework
