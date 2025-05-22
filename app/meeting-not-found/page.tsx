import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function MeetingNotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold">Reunião não encontrada</h1>
        <p className="mb-8 text-gray-600">A reunião que você está tentando acessar não existe ou foi encerrada.</p>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700">Voltar para a página inicial</Button>
        </Link>
      </div>
    </div>
  )
}
