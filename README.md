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
- Tailwind CSS for styling
- SQLite for local highlight storage
- Supabase for cloud-based highlight storage (optional)

## Getting Started

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables: `cp .env.example .env`
4. Run the development server: `pnpm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

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


## API Endpoints

### Embeddings
- `POST /api/embeddings/generate`
  - Generates semantic embeddings for each page of a PDF
  - Body: `{ pdfUrl: string, pdfId: string }`
  - Returns: `{ success: boolean, embeddings: PageEmbedding[], count: number }`

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
