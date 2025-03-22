"use client";

import type React from "react";

import { useState, useRef } from "react";
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PdfUploadProps {
    maxSizeMB?: number;
    onUpload?: (file: File) => void;
    className?: string;
}

export function Uploader({
    maxSizeMB = 10,
    onUpload,
    className,
}: PdfUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const validateFile = (file: File): boolean => {
        setError(null);

        if (!file.type.includes("pdf")) {
            setError("Please upload a PDF file");
            return false;
        }

        if (file.size > maxSizeBytes) {
            setError(`File size exceeds ${maxSizeMB}MB limit`);
            return false;
        }

        return true;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;

        if (validateFile(droppedFile)) {
            setFile(droppedFile);
            simulateUpload(droppedFile);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (validateFile(selectedFile)) {
            setFile(selectedFile);
            simulateUpload(selectedFile);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const simulateUpload = (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsUploading(false);
                    if (onUpload) onUpload(file);
                    return 100;
                }
                return prev + 5;
            });
        }, 100);
    };

    const removeFile = () => {
        setFile(null);
        setUploadProgress(0);
        setIsUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <Card
            className={cn(
                "w-full dark:bg-slate-800 dark:border-slate-700",
                className
            )}
        >
            <CardContent className="p-6">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                />

                {!file ? (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 transition-colors",
                            "flex flex-col items-center justify-center gap-4",
                            "cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-700/50",
                            isDragging
                                ? "border-primary bg-muted/50 dark:bg-slate-700/50"
                                : "border-muted-foreground/25 dark:border-slate-600/50",
                            error ? "border-destructive/50" : ""
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleButtonClick}
                    >
                        <div className="rounded-full bg-primary/10 p-4">
                            <UploadCloudIcon className="h-10 w-10 text-primary" />
                        </div>

                        <div className="flex flex-col items-center gap-1 text-center">
                            <h3 className="text-lg font-semibold">
                                Upload PDF
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Drag and drop your PDF file here or click to
                                browse
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                Maximum file size: {maxSizeMB}MB
                            </p>
                        </div>

                        <Button variant="outline" size="sm" className="mt-2">
                            Select PDF
                        </Button>

                        {error && (
                            <p className="text-sm text-destructive mt-2">
                                {error}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 dark:bg-slate-700/50">
                            <div className="rounded-full bg-primary/10 p-2 shrink-0">
                                <FileIcon className="h-6 w-6 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={removeFile}
                                disabled={isUploading}
                            >
                                <XIcon className="h-4 w-4" />
                                <span className="sr-only">Remove file</span>
                            </Button>
                        </div>

                        {isUploading ? (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <Progress
                                    value={uploadProgress}
                                    className="h-2"
                                />
                            </div>
                        ) : uploadProgress === 100 ? (
                            <p className="text-sm text-center text-primary">
                                Upload complete!
                            </p>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// import type React from "react";

// import { useState, useRef } from "react";
// import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { cn } from "@/lib/utils";

// interface PdfUploadProps {
//     maxSizeMB?: number;
//     onUpload?: (file: File) => void;
//     className?: string;
// }

// export function Uploader({
//     maxSizeMB = 10,
//     onUpload,
//     className,
// }: PdfUploadProps) {
//     const [isDragging, setIsDragging] = useState(false);
//     const [file, setFile] = useState<File | null>(null);
//     const [error, setError] = useState<string | null>(null);
//     const [uploadProgress, setUploadProgress] = useState(0);
//     const [isUploading, setIsUploading] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);

//     const maxSizeBytes = maxSizeMB * 1024 * 1024;

//     const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragging(true);
//     };

//     const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragging(false);
//     };

//     const validateFile = (file: File): boolean => {
//         setError(null);

//         if (!file.type.includes("pdf")) {
//             setError("Please upload a PDF file");
//             return false;
//         }

//         if (file.size > maxSizeBytes) {
//             setError(`File size exceeds ${maxSizeMB}MB limit`);
//             return false;
//         }

//         return true;
//     };

//     const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragging(false);

//         const droppedFile = e.dataTransfer.files[0];
//         if (!droppedFile) return;

//         if (validateFile(droppedFile)) {
//             setFile(droppedFile);
//             simulateUpload(droppedFile);
//         }
//     };

//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0];
//         if (!selectedFile) return;

//         if (validateFile(selectedFile)) {
//             setFile(selectedFile);
//             simulateUpload(selectedFile);
//         }
//     };

//     const handleButtonClick = () => {
//         fileInputRef.current?.click();
//     };

//     const simulateUpload = (file: File) => {
//         setIsUploading(true);
//         setUploadProgress(0);

//         // Simulate upload progress
//         const interval = setInterval(() => {
//             setUploadProgress((prev) => {
//                 if (prev >= 100) {
//                     clearInterval(interval);
//                     setIsUploading(false);
//                     if (onUpload) onUpload(file);
//                     return 100;
//                 }
//                 return prev + 5;
//             });
//         }, 100);
//     };

//     const removeFile = () => {
//         setFile(null);
//         setUploadProgress(0);
//         setIsUploading(false);
//         if (fileInputRef.current) {
//             fileInputRef.current.value = "";
//         }
//     };

//     return (
//         <Card
//             className={cn(
//                 "w-full dark:bg-slate-800 dark:border-slate-700",
//                 className
//             )}
//         >
//             <CardContent className="p-6">
//                 <input
//                     type="file"
//                     ref={fileInputRef}
//                     onChange={handleFileChange}
//                     accept=".pdf"
//                     className="hidden"
//                 />

//                 {!file ? (
//                     <div
//                         className={cn(
//                             "border-2 border-dashed rounded-lg p-8 transition-colors",
//                             "flex flex-col items-center justify-center gap-4",
//                             "cursor-pointer hover:bg-muted/50",
//                             isDragging
//                                 ? "border-primary bg-muted/50"
//                                 : "border-muted-foreground/25",
//                             error ? "border-destructive/50" : ""
//                         )}
//                         onDragOver={handleDragOver}
//                         onDragLeave={handleDragLeave}
//                         onDrop={handleDrop}
//                         onClick={handleButtonClick}
//                     >
//                         <div className="rounded-full bg-primary/10 p-4">
//                             <UploadCloudIcon className="h-10 w-10 text-primary" />
//                         </div>

//                         <div className="flex flex-col items-center gap-1 text-center">
//                             <h3 className="text-lg font-semibold">
//                                 Upload PDF
//                             </h3>
//                             <p className="text-sm text-muted-foreground">
//                                 Drag and drop your PDF file here or click to
//                                 browse
//                             </p>
//                             <p className="text-xs text-muted-foreground mt-2">
//                                 Maximum file size: {maxSizeMB}MB
//                             </p>
//                         </div>

//                         <Button variant="outline" size="sm" className="mt-2">
//                             Select PDF
//                         </Button>

//                         {error && (
//                             <p className="text-sm text-destructive mt-2">
//                                 {error}
//                             </p>
//                         )}
//                     </div>
//                 ) : (
//                     <div className="space-y-4">
//                         <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
//                             <div className="rounded-full bg-primary/10 p-2 shrink-0">
//                                 <FileIcon className="h-6 w-6 text-primary" />
//                             </div>

//                             <div className="flex-1 min-w-0">
//                                 <p className="text-sm font-medium truncate">
//                                     {file.name}
//                                 </p>
//                                 <p className="text-xs text-muted-foreground">
//                                     {(file.size / 1024 / 1024).toFixed(2)} MB
//                                 </p>
//                             </div>

//                             <Button
//                                 variant="ghost"
//                                 size="icon"
//                                 className="shrink-0"
//                                 onClick={removeFile}
//                                 disabled={isUploading}
//                             >
//                                 <XIcon className="h-4 w-4" />
//                                 <span className="sr-only">Remove file</span>
//                             </Button>
//                         </div>

//                         {isUploading ? (
//                             <div className="space-y-2">
//                                 <div className="flex justify-between text-xs">
//                                     <span>Uploading...</span>
//                                     <span>{uploadProgress}%</span>
//                                 </div>
//                                 <Progress
//                                     value={uploadProgress}
//                                     className="h-2"
//                                 />
//                             </div>
//                         ) : uploadProgress === 100 ? (
//                             <p className="text-sm text-center text-primary">
//                                 Upload complete!
//                             </p>
//                         ) : null}
//                     </div>
//                 )}
//             </CardContent>
//         </Card>
//     );
// }

// // "use client";
// // import { FC, FormEvent } from "react";

// // export const Uploader: FC = () => {
// //     const handleSubmit = (e: FormEvent) => {
// //         e.preventDefault();
// //         console.log("submit");
// //     };

// //     return (
// //         <form
// //             className="w-[500px] flex flex-col dark:bg-slate-800 p-5 gap-5 rounded-2xl"
// //             onSubmit={handleSubmit}
// //         >
// //             <label>Upload a PDF You Want to Chat With</label>
// //             <input className="bg-blue-500" type="file" />
// //             <button className="bg-blue-500" type="submit">
// //                 Upload
// //             </button>
// //         </form>
// //     );
// // };
