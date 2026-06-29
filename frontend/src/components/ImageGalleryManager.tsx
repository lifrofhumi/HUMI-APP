"use client";

import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UploadCloud, X, Star, Loader2, GripHorizontal } from "lucide-react";
import api from "@/lib/api";

interface EventImage {
  id: string;
  image_url: string;
  is_cover: boolean;
  position: number;
}

interface SortableImageProps {
  image: EventImage;
  onDelete: (id: string) => void;
  onSetCover: (id: string) => void;
}

function SortableImage({ image, onDelete, onSetCover }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative aspect-square rounded-2xl overflow-hidden group bg-surface border-2 ${image.is_cover ? 'border-primary' : 'border-white/10'} ${isDragging ? 'shadow-2xl shadow-primary/20 scale-105 opacity-80' : ''}`}
    >
      <img src={image.image_url} alt="Event" className="w-full h-full object-cover" />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <div className="flex justify-between items-start">
          <button 
            type="button"
            {...attributes} 
            {...listeners}
            className="p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripHorizontal size={18} />
          </button>

          <button 
            type="button"
            onClick={() => onDelete(image.id)}
            className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur transition-colors"
            title="Delete Image"
          >
            <X size={18} />
          </button>
        </div>

        {!image.is_cover && (
          <button 
            type="button"
            onClick={() => onSetCover(image.id)}
            className="w-full py-2 bg-black/60 hover:bg-primary hover:text-black text-white text-sm font-medium rounded-xl backdrop-blur transition-colors flex items-center justify-center gap-2"
          >
            <Star size={16} /> Make Cover
          </button>
        )}
      </div>

      {/* Cover Badge */}
      {image.is_cover && (
        <div className="absolute top-3 left-3 bg-primary text-black text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
          <Star size={12} className="fill-black" /> COVER
        </div>
      )}
    </div>
  );
}

interface ImageGalleryManagerProps {
  eventId: string;
  initialImages: EventImage[];
}

export default function ImageGalleryManager({ eventId, initialImages }: ImageGalleryManagerProps) {
  const [images, setImages] = useState<EventImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Sort initial images by position
    setImages([...initialImages].sort((a, b) => a.position - b.position));
  }, [initialImages]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((i) => i.id === active.id);
      const newIndex = images.findIndex((i) => i.id === over.id);
      
      const newImages = arrayMove(images, oldIndex, newIndex);
      
      // Update local state immediately for snappy UI
      setImages(newImages);

      // Persist to backend
      try {
        const orderedIds = newImages.map(img => img.id);
        await api.put(`/events/${eventId}/images/reorder`, { orderedIds });
      } catch (err) {
        console.error("Failed to reorder images:", err);
        // Revert on failure
        setImages(images);
        setError("Failed to save image order");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const { data } = await api.post(`/events/${eventId}/images`, formData);
      
      // data should contain the updated event with its images
      if (data.images) {
        setImages([...data.images].sort((a: any, b: any) => a.position - b.position));
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to upload images");
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      const { data } = await api.delete(`/events/${eventId}/images/${imageId}`);
      if (data.images) {
        setImages([...data.images].sort((a: any, b: any) => a.position - b.position));
      } else {
        setImages(images.filter(img => img.id !== imageId));
      }
    } catch (err: any) {
      console.error("Failed to delete image:", err);
      setError(err.response?.data?.error || "Failed to delete image");
    }
  };

  const handleSetCover = async (imageId: string) => {
    try {
      const { data } = await api.put(`/events/${eventId}/images/${imageId}/cover`);
      if (data.images) {
        setImages([...data.images].sort((a: any, b: any) => a.position - b.position));
      }
    } catch (err: any) {
      console.error("Failed to set cover image:", err);
      setError(err.response?.data?.error || "Failed to set cover image");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <SortableContext 
            items={images.map(i => i.id)}
            strategy={rectSortingStrategy}
          >
            {images.map((img) => (
              <SortableImage 
                key={img.id} 
                image={img} 
                onDelete={handleDelete}
                onSetCover={handleSetCover}
              />
            ))}
          </SortableContext>

          {/* Upload Dropzone */}
          <div className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors bg-surface/30 relative flex flex-col items-center justify-center p-4 text-center group cursor-pointer overflow-hidden">
            <input 
              type="file" 
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            {uploading ? (
              <div className="flex flex-col items-center text-primary">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="font-medium text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-text-muted group-hover:text-primary transition-colors">
                <UploadCloud size={32} className="mb-2" />
                <span className="font-medium text-sm mb-1 text-white group-hover:text-primary">Add Images</span>
                <span className="text-[10px]">Up to 10 files (5MB each)</span>
              </div>
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
