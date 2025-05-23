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
        "fixed left-[50%] top-[50%] z-50 w-[95%] max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
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
      <CustomDialogContent className="p-6 sm:p-8 lg:p-12 rounded-[20px] sm:rounded-[30px] lg:rounded-[40px] border-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Image
              src="https://www.gstatic.com/meet/permissions_flow_intro_v2_c5947bd823f46264583bfb8900f1b12d.svg"
              alt="Microfone e câmera"
              width={280}
              height={210}
              className="object-contain w-48 h-36 sm:w-64 sm:h-48 lg:w-[280px] lg:h-[210px]"
            />
          </div>
          
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-normal text-gray-900 text-center px-2">
            Microfone e câmera estão desativados
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 text-center text-sm sm:text-base leading-relaxed px-2 sm:px-4">
            O microfone e a câmera estão desativados por padrão conforme definido pelo 
            colaborador criador desta reunião.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8 mt-4 sm:mt-5">
          <div className="flex justify-center">
            <Button 
              onClick={onClose} 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 px-12 sm:py-4 sm:px-16 lg:py-5 lg:px-20 text-sm sm:text-base font-medium"
            >
              Entendi
            </Button>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed px-4 sm:px-6">
            Ao entrar na reunião você concorda com os Termos e Condições de privacidade
          </p>
        </div>
      </CustomDialogContent>
    </Dialog>
  )
} 