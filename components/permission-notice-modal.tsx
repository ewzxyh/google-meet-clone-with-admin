"use client"

import React, { useState, useEffect } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface PermissionNoticeModalProps {
  isOpen: boolean
  onClose: () => void
}

// Custom DialogContent without the X button
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))

export default function PermissionNoticeModal({ isOpen, onClose }: PermissionNoticeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <CustomDialogContent className="p-12 rounded-[40px] border-0">
        <DialogHeader className="text-center space-y-8">
          <div className="flex justify-center mb-6">
            <Image
              src="https://www.gstatic.com/meet/permissions_flow_intro_v2_c5947bd823f46264583bfb8900f1b12d.svg"
              alt="Microfone e câmera"
              width={280}
              height={210}
              className="object-contain"
            />
          </div>
          
          <DialogTitle className="text-2xl font-normal text-gray-900 text-center">
            Microfone e câmera estão desativados
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 text-center text-base leading-relaxed px-4">
            O microfone e a câmera estão desativados por padrão conforme definido pelo 
            colaborador criador desta reunião.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-5">
          <div className="flex justify-center">
            <Button 
              onClick={onClose} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-5 px-20 text-base font-medium"
            >
              Entendi
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 text-center leading-relaxed px-6">
            Ao entrar na reunião você concorda com os Termos e Condições de privacidade
          </p>
        </div>
      </CustomDialogContent>
    </Dialog>
  )
} 