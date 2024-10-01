import React from "react";
import { Button } from "./Button";
import { Trash2 } from "lucide-react";

interface DeletePdfsButtonProps {
  onDeletePdfs: () => void; // Function to call for deleting PDFs
}

const DeletePdfsButton: React.FC<DeletePdfsButtonProps> = ({
  onDeletePdfs,
}) => {
  return (
    <div className="text-center inline-flex items-center justify-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-full bg-red-500 text-white hover:bg-red-600">
      <Button
        type="button"
        onClick={onDeletePdfs} // Call the delete function
        className="w-full"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {"Delete All PDFs"} {/* Button text */}
      </Button>
    </div>
  );
};

export default DeletePdfsButton;
