import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { redirect } from "next/navigation"
import { generateMeetingId } from "@/lib/utils"
import { supabaseServer } from "@/lib/supabase"

export default async function Home() {
  async function createMeeting() {
    "use server"
    const meetingId = generateMeetingId()

    // Obter URL padrão do localStorage (não funciona no servidor, então usamos um valor padrão)
    const defaultVideoUrl = "https://mhvzjal0ig61abwu.public.blob.vercel-storage.com/Amanda-QQLE8o1Zw9BaYtLwXmBoIBUToihnWY.mp4"

    // If Supabase is available, create a meeting in the database
    if (supabaseServer) {
      try {
        const { error } = await supabaseServer.from("meetings").insert({
          meeting_id: meetingId,
          status: "ativo", // Traduzido para português
          video_url: defaultVideoUrl,
        })

        if (error) {
          console.error("Erro ao criar reunião:", error)
        }
      } catch (error) {
        console.error("Erro em createMeeting:", error)
      }
    } else {
      console.warn("Cliente Supabase não inicializado. Prosseguindo sem operação de banco de dados.")
    }

    // Redirect to the meeting page regardless of database operation
    redirect(`/${meetingId}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="flex items-center">
            <Image
              src="/videozapp.webp"
              alt="VideoZapp"
              width={180}
              height={50}
              className="h-14 w-auto mr-2"
            />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-normal text-gray-900">Iniciar ou participar de uma reunião</h2>
          </div>

          <div className="mt-8 space-y-6">
            <form className="space-y-4">
              <div>
                <Input type="text" placeholder="Digite o código da reunião" className="w-full" />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Participar</Button>
            </form>

            {/* <form action={createMeeting}>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Iniciar uma nova reunião
              </Button>
            </form> */}
          </div>
        </div>
      </main>
    </div>
  )
}
