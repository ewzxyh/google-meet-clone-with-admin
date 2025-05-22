import { Button } from "@/components/ui/button"
import { Info, Users, MoreVertical } from "lucide-react"

interface HeaderProps {
  meetingId: string
}

export default function Header({ meetingId }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2 text-white">
      <div className="flex items-center">
        <h1 className="text-lg font-medium">{meetingId}</h1>
        <div className="ml-4 h-4 w-px bg-gray-600"></div>
        <Button variant="ghost" size="sm" className="ml-4 text-gray-300 hover:text-white">
          <Info className="mr-2 h-4 w-4" />
          Meeting details
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
          <Users className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
