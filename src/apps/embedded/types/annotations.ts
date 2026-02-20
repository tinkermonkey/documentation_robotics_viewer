/**
 * Annotation Types
 * Types for annotations (comments) on model elements
 */

export interface Annotation {
  id: string;
  elementId: string;          // Element this annotation is attached to
  author: string;             // Who created the annotation
  content: string;            // Annotation text content
  createdAt: string;          // ISO timestamp
  updatedAt?: string;         // ISO timestamp (if edited)
  resolved: boolean;          // Whether annotation has been resolved
  replies?: AnnotationReply[]; // Thread of replies
}

export interface AnnotationReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface AnnotationCreate {
  elementId: string;
  content: string;
}

export interface AnnotationUpdate {
  content?: string;
  resolved?: boolean;
}
