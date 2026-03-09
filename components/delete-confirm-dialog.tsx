"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  /** What is being deleted, e.g. "measurement", "hypercert" */
  itemType: string;
  /** Optional item name/title for the description */
  itemName?: string;
  /** Whether the delete is in progress */
  isDeleting: boolean;
  /** Called when user confirms deletion */
  onConfirm: () => void;
  /** Optional trigger element — defaults to a trash icon button */
  trigger?: React.ReactElement;
}

export function DeleteConfirmDialog({
  itemType,
  itemName,
  isDeleting,
  onConfirm,
  trigger,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive h-8 w-8"
            aria-label={`Delete ${itemType}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {itemType}?</AlertDialogTitle>
          <AlertDialogDescription>
            {itemName
              ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
              : `Are you sure you want to delete this ${itemType}? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Spinner className="mr-2" /> Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
