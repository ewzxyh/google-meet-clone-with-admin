"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send } from "lucide-react"

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="flex w-80 flex-col border-l border-gray-700 bg-gray-800 text-white">
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        <h2 className="text-lg font-medium">In-call messages</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col space-y-4">
          <div className="rounded-lg bg-gray-700 p-3">
            <p className="text-sm font-medium">System</p>
            <p className="text-sm text-gray-300">Meeting started</p>
          </div>

          <div className="rounded-lg bg-gray-700 p-3">
            <p className="text-sm font-medium">System</p>
            <p className="text-sm text-gray-300">You joined the meeting</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center space-x-2">
          <Input type="text" placeholder="Send a message" className="bg-gray-700 text-white" />
          <Button variant="ghost" size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
