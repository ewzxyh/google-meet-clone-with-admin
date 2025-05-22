"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSupabaseBrowser } from "@/lib/supabase"
import { generateMeetingId } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Meeting {
  id: number
  meeting_id: string
  status: string
  video_url: string
  created_at: string
}

interface AdminPanelProps {
  meetings: Meeting[]
}

// Traduções de status
const statusTranslations = {
  active: "ativo",
  ended: "encerrado",
  ativo: "active",
  encerrado: "ended",
}

export default function AdminPanel({ meetings: initialMeetings }: AdminPanelProps) {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [newMeetingVideoUrl, setNewMeetingVideoUrl] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [defaultVideoUrl, setDefaultVideoUrl] = useState<string>(
    "https://www.youtube.com/watch?v=_K9YV4t9dzY&ab_channel=WillSilva",
  )
  const [isDefaultUrlDialogOpen, setIsDefaultUrlDialogOpen] = useState(false)
  const [newMeetingData, setNewMeetingData] = useState<Meeting | null>(null)
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false)

  // Carregar URL padrão do localStorage ao iniciar
  useEffect(() => {
    const savedUrl = localStorage.getItem("defaultVideoUrl")
    if (savedUrl) {
      setDefaultVideoUrl(savedUrl)
    }
  }, [])

  // Salvar URL padrão no localStorage quando mudar
  const saveDefaultUrl = () => {
    localStorage.setItem("defaultVideoUrl", defaultVideoUrl)
    setIsDefaultUrlDialogOpen(false)
    toast({
      title: "URL padrão atualizada",
      description: "A URL padrão para novas reuniões foi atualizada com sucesso.",
    })
  }

  // Filtrar reuniões com base no status, data e pesquisa
  const filteredMeetings = meetings
    .filter((meeting) => {
      // Status filter
      if (statusFilter !== "all") {
        const translatedStatus = statusTranslations[meeting.status as keyof typeof statusTranslations] || meeting.status
        if (translatedStatus !== statusFilter && meeting.status !== statusFilter) {
          return false
        }
      }

      // Date filter
      if (dateFilter !== "all") {
        const meetingDate = new Date(meeting.created_at)
        const today = new Date()

        if (dateFilter === "today") {
          return meetingDate.toDateString() === today.toDateString()
        } else if (dateFilter === "week") {
          const weekAgo = new Date()
          weekAgo.setDate(today.getDate() - 7)
          return meetingDate >= weekAgo
        } else if (dateFilter === "month") {
          const monthAgo = new Date()
          monthAgo.setMonth(today.getMonth() - 1)
          return meetingDate >= monthAgo
        }
      }

      return true
    })
    .filter((meeting) => {
      // Search filter
      if (searchQuery.trim() === "") return true
      return meeting.meeting_id.toLowerCase().includes(searchQuery.toLowerCase())
    })

  const createMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    const videoUrl = newMeetingVideoUrl.trim() || defaultVideoUrl
    const meetingId = generateMeetingId()
    const supabase = getSupabaseBrowser()

    if (!supabase) {
      console.warn("Cliente Supabase não inicializado")
      return
    }

    const { data, error } = await supabase
      .from("meetings")
      .insert({
        meeting_id: meetingId,
        status: "ativo", // Traduzido para português
        video_url: videoUrl,
      })
      .select()

    if (!error && data) {
      const newMeeting = data[0]
      setMeetings([newMeeting, ...meetings])
      setNewMeetingVideoUrl("")

      // Abrir diálogo com informações da nova reunião
      setNewMeetingData(newMeeting)
      setIsNewMeetingDialogOpen(true)
    } else if (error) {
      console.error("Erro ao criar reunião:", error)
      toast({
        title: "Erro ao criar reunião",
        description: "Ocorreu um erro ao criar a reunião. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const copyMeetingUrl = (meetingId: string) => {
    const url = `${window.location.origin}/${meetingId}`
    navigator.clipboard.writeText(url)
    toast({
      title: "URL copiada",
      description: "A URL da reunião foi copiada para a área de transferência.",
    })
  }

  const endMeeting = async (meetingId: string) => {
    const supabase = getSupabaseBrowser()

    if (!supabase) {
      console.warn("Cliente Supabase não inicializado")
      return
    }

    const { error } = await supabase.from("meetings").update({ status: "encerrado" }).eq("meeting_id", meetingId)

    if (!error) {
      setMeetings(
        meetings.map((meeting) => (meeting.meeting_id === meetingId ? { ...meeting, status: "encerrado" } : meeting)),
      )
      toast({
        title: "Reunião encerrada",
        description: `A reunião ${meetingId} foi encerrada com sucesso.`,
      })
    } else {
      console.error("Erro ao encerrar reunião:", error)
      toast({
        title: "Erro ao encerrar reunião",
        description: "Ocorreu um erro ao encerrar a reunião. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const deleteMeeting = async (meetingId: string) => {
    const supabase = getSupabaseBrowser()

    if (!supabase) {
      console.warn("Cliente Supabase não inicializado")
      return
    }

    const { error } = await supabase.from("meetings").delete().eq("meeting_id", meetingId)

    if (!error) {
      setMeetings(meetings.filter((meeting) => meeting.meeting_id !== meetingId))
      setIsNewMeetingDialogOpen(false)
      toast({
        title: "Reunião excluída",
        description: `A reunião ${meetingId} foi excluída com sucesso.`,
      })
    } else {
      console.error("Erro ao excluir reunião:", error)
      toast({
        title: "Erro ao excluir reunião",
        description: "Ocorreu um erro ao excluir a reunião. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const deleteAllEndedMeetings = async () => {
    setIsDeleting(true)

    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        console.warn("Cliente Supabase não inicializado")
        return
      }

      const { error } = await supabase.from("meetings").delete().eq("status", "encerrado")

      if (!error) {
        setMeetings(meetings.filter((meeting) => meeting.status !== "encerrado"))
        toast({
          title: "Reuniões encerradas excluídas",
          description: "Todas as reuniões encerradas foram excluídas com sucesso.",
        })
      } else {
        console.error("Erro ao excluir reuniões encerradas:", error)
        toast({
          title: "Erro ao excluir reuniões",
          description: "Ocorreu um erro ao excluir as reuniões encerradas. Tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Toaster />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel de Administração</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsDefaultUrlDialogOpen(true)}>
            Configurar URL Padrão
          </Button>
          <Button onClick={() => router.push("/")}>Voltar para Início</Button>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 p-6">
        <h2 className="mb-4 text-xl font-semibold">Criar Nova Reunião</h2>
        <form onSubmit={createMeeting} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">URL do Vídeo (opcional)</label>
            <Input
              type="url"
              value={newMeetingVideoUrl}
              onChange={(e) => setNewMeetingVideoUrl(e.target.value)}
              placeholder="Digite a URL do vídeo ou deixe em branco para usar a URL padrão"
            />
            <p className="mt-1 text-xs text-gray-500">
              Suporta URLs do YouTube (ex: https://www.youtube.com/watch?v=_K9YV4t9dzY) ou URLs diretas de arquivos de
              vídeo
            </p>
          </div>
          <Button type="submit">Criar Reunião</Button>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Gerenciar Reuniões</h2>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!meetings.some((m) => m.status === "encerrado")}>
                Excluir Todas Reuniões Encerradas
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente todas as reuniões com status
                  "encerrado".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAllEndedMeetings} disabled={isDeleting}>
                  {isDeleting ? "Excluindo..." : "Excluir Todas"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Data:</span>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Últimos 7 Dias</SelectItem>
                <SelectItem value="month">Últimos 30 Dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Input
              type="text"
              placeholder="Pesquisar por ID da reunião"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID da Reunião</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhuma reunião encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.meeting_id}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          meeting.status === "ativo" || meeting.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {meeting.status === "active"
                          ? "ativo"
                          : meeting.status === "ended"
                            ? "encerrado"
                            : meeting.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(meeting.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/${meeting.meeting_id}`)}>
                          Visualizar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyMeetingUrl(meeting.meeting_id)}>
                          Copiar URL
                        </Button>
                        {(meeting.status === "ativo" || meeting.status === "active") && (
                          <Button variant="outline" size="sm" onClick={() => endMeeting(meeting.meeting_id)}>
                            Encerrar
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => deleteMeeting(meeting.meeting_id)}>
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Diálogo para configurar URL padrão */}
      <Dialog open={isDefaultUrlDialogOpen} onOpenChange={setIsDefaultUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar URL Padrão</DialogTitle>
            <DialogDescription>
              Defina a URL de vídeo padrão que será usada quando uma nova reunião for criada sem uma URL específica.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="default-url">URL Padrão</Label>
              <Input
                id="default-url"
                value={defaultVideoUrl}
                onChange={(e) => setDefaultVideoUrl(e.target.value)}
                placeholder="URL do vídeo padrão"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDefaultUrlDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveDefaultUrl}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para nova reunião criada */}
      <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reunião Criada com Sucesso</DialogTitle>
            <DialogDescription>
              A reunião foi criada com sucesso. Use as informações abaixo para acessar ou compartilhar a reunião.
            </DialogDescription>
          </DialogHeader>
          {newMeetingData && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Código da Reunião</Label>
                <div className="flex items-center gap-2">
                  <Input value={newMeetingData.meeting_id} readOnly />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(newMeetingData.meeting_id)}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>URL da Reunião</Label>
                <div className="flex items-center gap-2">
                  <Input value={`${window.location.origin}/${newMeetingData.meeting_id}`} readOnly />
                  <Button variant="outline" size="sm" onClick={() => copyMeetingUrl(newMeetingData.meeting_id)}>
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => newMeetingData && deleteMeeting(newMeetingData.meeting_id)}>
              Apagar
            </Button>
            <Button onClick={() => setIsNewMeetingDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
