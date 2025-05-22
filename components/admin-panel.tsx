"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
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
import { 
  Copy, 
  Trash2, 
  Video, 
  VideoOff, 
  Settings2, 
  PlusCircle, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ListChecks,
  Edit,
  Power,
  PowerOff,
  ShieldAlert,
  ShieldCheck,
  Search,
  ListFilter,
  CalendarDays,
  Hash,
  ToggleRight,
  CalendarPlus,
  Settings,
  Link,
  CalendarIcon,
  Check,
  Ban,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export interface Meeting {
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
  active: "Ativado",
  ended: "Finalizado",
  Ativado: "active",
  Finalizado: "ended",
}

export default function AdminPanel({ meetings: initialMeetings }: AdminPanelProps) {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[]>(
    initialMeetings.map(m => ({...m, status: m.status === 'active' ? 'Ativado' : m.status === 'ended' ? 'Finalizado' : m.status }))
  )
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
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([])
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<"activate" | "end" | "delete" | null>(null)
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [isToDatePickerOpen, setIsToDatePickerOpen] = useState(false)
  const [isUrlSaveConfirmDialogOpen, setIsUrlSaveConfirmDialogOpen] = useState(false)

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
    setIsUrlSaveConfirmDialogOpen(true)
  }

  // Função para selecionar/desselecionar todas as reuniões visíveis
  const toggleSelectAll = () => {
    if (selectedMeetings.length === filteredMeetings.length) {
      setSelectedMeetings([])
    } else {
      setSelectedMeetings(filteredMeetings.map((m) => m.meeting_id))
    }
  }

  // Função para selecionar/desselecionar uma reunião individual
  const toggleSelectMeeting = (meetingId: string) => {
    setSelectedMeetings((prevSelected) =>
      prevSelected.includes(meetingId) ? prevSelected.filter((id) => id !== meetingId) : [...prevSelected, meetingId],
    )
  }

  // Função para abrir o diálogo de ação em massa
  const openBulkActionDialog = (action: "activate" | "end" | "delete") => {
    setBulkActionType(action)
    setIsBulkActionDialogOpen(true)
  }

  // Função para executar a ação em massa
  const handleBulkAction = async () => {
    if (!bulkActionType || selectedMeetings.length === 0) return

    const supabase = getSupabaseBrowser()
    if (!supabase) {
      console.warn("Cliente Supabase não inicializado")
      return
    }

    let successMessage = ""
    let errorMessage = ""
    let errorOccurred = false

    try {
      if (bulkActionType === "delete") {
        const { error } = await supabase.from("meetings").delete().in("meeting_id", selectedMeetings)
        if (error) throw error
        setMeetings(meetings.filter((m) => !selectedMeetings.includes(m.meeting_id)))
        successMessage = "Reuniões selecionadas excluídas com sucesso."
        errorMessage = "Erro ao excluir reuniões selecionadas."
      } else {
        const newLocalStatus = bulkActionType === "activate" ? "Ativado" : "Finalizado"
        const supabasePersistStatus = statusTranslations[newLocalStatus as keyof typeof statusTranslations] || newLocalStatus
        
        const { error } = await supabase
          .from("meetings")
          .update({ status: supabasePersistStatus })
          .in("meeting_id", selectedMeetings)
        if (error) throw error
        setMeetings(
          meetings.map((m) => (selectedMeetings.includes(m.meeting_id) ? { ...m, status: newLocalStatus } : m)),
        )
        successMessage = `Reuniões selecionadas ${newLocalStatus === "Ativado" ? "ativadas" : "finalizadas"} com sucesso.`
        errorMessage = `Erro ao ${newLocalStatus === "Ativado" ? "ativar" : "finalizar"} reuniões selecionadas.`
      }
      toast({
        title: "Ação em massa concluída",
        description: successMessage,
      })
    } catch (error) {
      console.error(errorMessage, error)
      toast({
        title: "Erro na ação em massa",
        description: `${errorMessage} Tente novamente.`,
        variant: "destructive",
      })
      errorOccurred = true
    }

    setSelectedMeetings([])
    setIsBulkActionDialogOpen(false)
    setBulkActionType(null)
  }

  // Filtrar reuniões com base no status, data e pesquisa
  const filteredMeetings = meetings
    .filter((meeting) => {
      // Status filter
      if (statusFilter !== "all") {
        if (meeting.status !== statusFilter) {
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
        } else if (dateFilter === "custom") {
          if (customDateRange.from && customDateRange.to) {
            // Ajustar 'to' para o final do dia para incluir todas as reuniões do dia selecionado
            const toDate = new Date(customDateRange.to)
            toDate.setHours(23, 59, 59, 999)
            return meetingDate >= customDateRange.from && meetingDate <= toDate
          } else if (customDateRange.from) {
            return meetingDate >= customDateRange.from
          } else if (customDateRange.to) {
            // Ajustar 'to' para o final do dia
            const toDate = new Date(customDateRange.to)
            toDate.setHours(23, 59, 59, 999)
            return meetingDate <= toDate
          }
          return true // Se custom está selecionado mas nenhuma data foi escolhida, não filtra por data
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
        status: "active",
        video_url: videoUrl,
      })
      .select()

    if (!error && data) {
      const newMeetingFromSupabase = data[0] as unknown as Meeting
      // Garante que o estado local use "Ativado"
      const newMeetingForState: Meeting = { 
        ...newMeetingFromSupabase, 
        status: "Ativado" 
      }
      setMeetings([newMeetingForState, ...meetings])
      setNewMeetingVideoUrl("")

      setNewMeetingData(newMeetingForState)
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
    // Atualiza para "ended" no Supabase, mas "Finalizado" localmente
    const { error } = await supabase.from("meetings").update({ status: "ended" }).eq("meeting_id", meetingId)

    if (!error) {
      setMeetings(
        meetings.map((meeting) => (meeting.meeting_id === meetingId ? { ...meeting, status: "Finalizado" } : meeting)),
      )
      toast({
        title: "Reunião Finalizada",
        description: `A reunião ${meetingId} foi finalizada com sucesso.`,
      })
    } else {
      console.error("Erro ao finalizar reunião:", error)
      toast({
        title: "Erro ao Finalizar Reunião",
        description: "Ocorreu um erro ao finalizar a reunião. Tente novamente.",
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

      // Exclui no Supabase usando "ended"
      const { error } = await supabase.from("meetings").delete().eq("status", "ended")

      if (!error) {
        // Filtra localmente usando "Finalizado"
        setMeetings(meetings.filter((meeting) => meeting.status !== "Finalizado"))
        toast({
          title: "Reuniões finalizadas excluídas",
          description: "Todas as reuniões finalizadas foram excluídas com sucesso.",
        })
      } else {
        console.error("Erro ao excluir reuniões finalizadas:", error)
        toast({
          title: "Erro ao excluir reuniões",
          description: "Ocorreu um erro ao excluir as reuniões finalizadas. Tente novamente.",
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <Toaster />
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700">Painel de Administração de Reuniões</h1>
        <p className="text-gray-600 mt-1">Gerencie suas reuniões de forma eficiente.</p>
      </header>

      {/* Seção de Criação de Nova Reunião e Configuração de URL Padrão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:mb-8 p-6 bg-sky-100 border border-sky-500 rounded-lg shadow-md">
        <div className="md:pr-3 md:border-r md:border-sky-300">
          <h2 className="text-xl font-semibold text-sky-700 mb-3">Criar Nova Reunião</h2>
          <form onSubmit={createMeeting} className="space-y-4">
            <div>
              <Label htmlFor="video-url" className="text-sky-700">
                URL do Vídeo <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-300 text-yellow-800 border border-yellow-500 rounded-full">Opcional</span>
              </Label>
              <Input
                id="video-url"
                type="text"
                value={newMeetingVideoUrl}
                onChange={(e) => setNewMeetingVideoUrl(e.target.value)}
                placeholder={`Padrão: ${defaultVideoUrl}`}
                className="mt-4 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
              />
            </div>
            <Button type="submit" className="w-full md:w-auto bg-sky-500 hover:bg-sky-600 text-white border border-sky-700">
              <PlusCircle className="mr-2 h-5 w-5" /> Criar Reunião
            </Button>
          </form>
        </div>
        <div className="md:pl-3">
          <h2 className="text-xl font-semibold text-sky-700 mb-3">URL de Vídeo Padrão</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="default-video-url" className="text-sky-700">
                Link do vídeo <span className="ml-2 px-2 py-0.5 text-xs font-normal bg-gray-200 text-gray-700 border border-gray-400 rounded-full">Padrão para todas as reuniões</span>
              </Label>
              <Input
                id="default-video-url"
                type="text"
                value={defaultVideoUrl}
                onChange={(e) => setDefaultVideoUrl(e.target.value)}
                placeholder="Insira a URL padrão do vídeo"
                className="mt-4 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
              />
            </div>
            <Button onClick={saveDefaultUrl} className="w-full md:w-auto bg-teal-500 hover:bg-teal-600 text-white border border-teal-700">
              <Link className="mr-2 h-5 w-5" /> Salvar URL Padrão
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros e Ações em Massa */}
      <div className="mb-6 p-4 bg-sky-100 border border-sky-500 rounded-lg shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 items-end">
          <div>
            <Label htmlFor="search-meeting" className="text-sky-700 flex items-center">
              <Search className="mr-2 h-4 w-4 text-sky-600" /> Buscar por ID
            </Label>
            <Input
              id="search-meeting"
              type="text"
              placeholder="Digite o ID da reunião..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
            />
          </div>
          <div>
            <Label htmlFor="status-filter" className="text-sky-700 flex items-center">
              <ListFilter className="mr-2 h-4 w-4 text-sky-600" /> Filtrar por Status
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white text-sky-800">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-sky-500 text-sky-800">
                <SelectItem value="all" className="hover:bg-sky-200">Todos</SelectItem>
                <SelectItem value="Ativado" className="hover:bg-sky-200">Ativado</SelectItem>
                <SelectItem value="Finalizado" className="hover:bg-sky-200">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-filter" className="text-sky-700 flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-sky-600" /> Filtrar por Data
            </Label>
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value)
                if (value !== "custom") {
                  setCustomDateRange({}) // Limpa o intervalo personalizado se outra opção for selecionada
                }
              }}
            >
              <SelectTrigger className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white text-sky-800">
                <SelectValue placeholder="Qualquer data" />
              </SelectTrigger>
              <SelectContent className="bg-white border-sky-500 text-sky-800">
                <SelectItem value="all" className="hover:bg-sky-200">Qualquer data</SelectItem>
                <SelectItem value="today" className="hover:bg-sky-200">Hoje</SelectItem>
                <SelectItem value="week" className="hover:bg-sky-200">Última Semana</SelectItem>
                <SelectItem value="month" className="hover:bg-sky-200">Último Mês</SelectItem>
                <SelectItem value="custom" className="hover:bg-sky-200">Personalizado...</SelectItem>
              </SelectContent>
            </Select>
            {dateFilter === "custom" && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-sky-300 rounded-md bg-sky-50">
                <div>
                  <Label className="text-xs text-sky-700">De:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1 bg-white border-sky-400 hover:bg-sky-100",
                          !customDateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.from ? format(customDateRange.from, "dd/MM/yyyy", { locale: ptBR }) : <span>Selec. data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-sky-500" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateRange.from}
                        onSelect={(date) => {
                          setCustomDateRange((prev) => ({ ...prev, from: date, to: prev.to && date && prev.to < date ? undefined : prev.to }))
                          if (date) {
                            setIsToDatePickerOpen(true)
                          }
                        }}
                        initialFocus
                        className="text-sky-800 rounded-md border border-sky-300"
                        modifiers={{
                          selected_from: customDateRange.from || new Date(0),
                          selected_to: customDateRange.to || new Date(0),
                          selected_range: customDateRange.from && customDateRange.to ? { from: customDateRange.from, to: customDateRange.to } : { from: new Date(0), to: new Date(0) }
                        }}
                        modifiersClassNames={{
                          selected_from: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-full",
                          selected_to: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-full",
                          selected_range: "bg-sky-100 text-sky-800 rounded-none",
                          today: "text-orange-500 font-bold"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className="text-xs text-sky-700">Até:</Label>
                  <Popover open={isToDatePickerOpen} onOpenChange={setIsToDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1 bg-white border-sky-400 hover:bg-sky-100",
                          !customDateRange.to && "text-muted-foreground"
                        )}
                        disabled={!customDateRange.from}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.to ? format(customDateRange.to, "dd/MM/yyyy", { locale: ptBR }) : <span>Selec. data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-sky-500" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateRange.to}
                        onSelect={(date) => {
                          setCustomDateRange((prev) => ({ ...prev, to: date }))
                          setIsToDatePickerOpen(false)
                        }}
                        disabled={(date) => customDateRange.from ? date < customDateRange.from : false}
                        initialFocus
                        className="text-sky-800 rounded-md border border-sky-300"
                        modifiers={{
                          selected_from: customDateRange.from || new Date(0),
                          selected_to: customDateRange.to || new Date(0),
                          selected_range: customDateRange.from && customDateRange.to ? { from: customDateRange.from, to: customDateRange.to } : { from: new Date(0), to: new Date(0) }
                        }}
                        modifiersClassNames={{
                          selected_from: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-full",
                          selected_to: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 rounded-full",
                          selected_range: "bg-sky-100 text-sky-800 rounded-none",
                          today: "text-orange-500 font-bold"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Botão para Excluir Reuniões Finalizadas */} 
          <div className="mt-auto"> {/* Alterado para alinhar o botão na parte inferior */} 
            {meetings.some((m) => m.status === "Finalizado") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-red-100 text-red-700 border-red-400 hover:bg-red-200 hover:border-red-500"
                      disabled={isDeleting}
                      title="Excluir todas as reuniões com status Finalizado"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir Reuniões Finalizadas
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border-red-500">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-700 flex items-center">
                        <span className="mr-2 p-1.5 bg-red-100 border border-red-300 rounded-md">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </span>
                        Excluir Reuniões Finalizadas
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600 pt-2">
                        Tem certeza que deseja excluir TODAS as reuniões com status "Finalizado"?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-400 text-gray-700 hover:bg-gray-200 flex items-center">
                        <Ban className="mr-2 h-4 w-4" /> Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAllEndedMeetings}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700 border-red-700 text-white flex items-center"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
          </div> 
        </div>

        {selectedMeetings.length > 0 && (
          <div className="mt-4 p-4 bg-amber-100 border border-amber-500 rounded-md">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              {selectedMeetings.length} reunião(ões) selecionada(s)
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => openBulkActionDialog("activate")}
                className="bg-green-500 hover:bg-green-600 text-white border border-green-700"
              >
                <Power className="mr-2 h-5 w-5" /> Ativar Selecionadas
              </Button>
              <Button
                onClick={() => openBulkActionDialog("end")}
                className="bg-orange-500 hover:bg-orange-600 text-white border border-orange-700"
              >
                <PowerOff className="mr-2 h-5 w-5" /> Encerrar Selecionadas
              </Button>
              <Button
                onClick={() => openBulkActionDialog("delete")}
                className="bg-red-500 hover:bg-red-600 text-white border border-red-700"
              >
                <Trash2 className="mr-2 h-5 w-5" /> Excluir Selecionadas
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Reuniões */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-sky-300">
        <Table>
          <TableHeader className="bg-sky-200">
            <TableRow className="border-b-sky-400">
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas as reuniões"
                  className="border-sky-500 data-[state=checked]:bg-sky-500 data-[state=checked]:text-white"
                />
              </TableHead>
              <TableHead className="text-sky-800 font-semibold">
                <div className="flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-sky-600" /> ID da Reunião
                </div>
              </TableHead>
              <TableHead className="text-sky-800 font-semibold">
                <div className="flex items-center">
                  <ToggleRight className="mr-2 h-4 w-4 text-sky-600" /> Status
                </div>
              </TableHead>
              <TableHead className="text-sky-800 font-semibold">
                <div className="flex items-center">
                  <CalendarPlus className="mr-2 h-4 w-4 text-sky-600" /> Data de Criação
                </div>
              </TableHead>
              <TableHead className="text-right text-sky-800 font-semibold pr-6">
                <div className="flex items-center justify-end">
                  <Settings className="mr-2 h-4 w-4 text-sky-600" /> Ações
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                  Nenhuma reunião encontrada com os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredMeetings.map((meeting) => (
                <TableRow key={meeting.id} className="border-b-sky-200 hover:bg-sky-50">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedMeetings.includes(meeting.meeting_id)}
                      onCheckedChange={() => toggleSelectMeeting(meeting.meeting_id)}
                      aria-label={`Selecionar reunião ${meeting.meeting_id}`}
                      className="border-sky-500 data-[state=checked]:bg-sky-500 data-[state=checked]:text-white"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sky-700">
                    <div className="flex items-center">
                      {meeting.meeting_id}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-sky-600 hover:text-sky-800 p-1 h-auto"
                        onClick={() => copyMeetingUrl(meeting.meeting_id)}
                        title="Copiar URL da reunião"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full border ${ 
                        meeting.status === "Ativado"
                          ? "bg-green-100 text-green-700 border-green-500"
                          : "bg-red-100 text-red-700 border-red-500"
                      }`}
                    >
                      {meeting.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(meeting.created_at).toLocaleDateString("pt-BR")} {new Date(meeting.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit'})}
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${meeting.meeting_id}`)}
                        className="text-blue-600 border-blue-500 hover:bg-blue-100 hover:text-blue-700"
                        title="Visualizar Reunião"
                      >
                        <ExternalLink className="mr-1 h-4 w-4" /> Visualizar
                      </Button>
                      {meeting.status === "Ativado" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => endMeeting(meeting.meeting_id)}
                          className="text-orange-600 border-orange-500 hover:bg-orange-100 hover:text-orange-700"
                          title="Finalizar Reunião"
                        >
                          <PowerOff className="mr-1 h-4 w-4" /> Finalizar
                        </Button>
                      ) : (
                         <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const supabase = getSupabaseBrowser()
                            if (supabase) {
                                // Atualiza para "active" no Supabase
                                supabase.from("meetings").update({ status: "active" }).eq("meeting_id", meeting.meeting_id)
                                .then(({error}) => {
                                    if (!error) {
                                        // Atualiza para "Ativado" localmente
                                        setMeetings(meetings.map(m => m.meeting_id === meeting.meeting_id ? {...m, status: 'Ativado'} : m))
                                        toast({ title: "Reunião Ativada", description: `A reunião ${meeting.meeting_id} foi reativada.`})
                                    } else {
                                        toast({ title: "Erro ao Ativar", description: "Não foi possível reativar a reunião.", variant: "destructive"})
                                    }
                                })
                            } 
                          }}
                          className="text-green-600 border-green-500 hover:bg-green-100 hover:text-green-700"
                          title="Ativar Reunião"
                        >
                          <Power className="mr-1 h-4 w-4" /> Ativar
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="text-red-600 bg-transparent border border-red-500 hover:bg-red-100 hover:text-red-700"
                            title="Excluir Reunião"
                          >
                            <Trash2 className="mr-1 h-4 w-4" /> Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border-red-500">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-700 flex items-center">
                              <span className="mr-2 p-1.5 bg-red-100 border border-red-300 rounded-md">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                              </span>
                              Confirmar Exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 pt-2">
                              Tem certeza que deseja excluir a reunião <strong className="text-red-600">{meeting.meeting_id}</strong>? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gray-400 text-gray-700 hover:bg-gray-200 flex items-center">
                              <Ban className="mr-2 h-4 w-4" /> Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMeeting(meeting.meeting_id)}
                              className="bg-red-600 hover:bg-red-700 text-white border-red-700 flex items-center"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Confirmar Exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo para Ações em Massa */}
      <AlertDialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <AlertDialogContent className="bg-white border-sky-500">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sky-700">
              Confirmar Ação em Massa: {
                bulkActionType === "activate" ? "Ativar" :
                bulkActionType === "end" ? "Encerrar" :
                bulkActionType === "delete" ? "Excluir" : ""
              } Reuniões
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Você selecionou <strong className="text-sky-600">{selectedMeetings.length}</strong> reunião(ões). 
              {bulkActionType === "delete" 
                ? "Esta ação não pode ser desfeita e excluirá permanentemente as reuniões selecionadas."
                : `Tem certeza que deseja ${bulkActionType === "activate" ? "ativar" : "encerrar"} as reuniões selecionadas?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-400 text-gray-700 hover:bg-gray-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={`${ 
                bulkActionType === "delete" ? "bg-red-600 hover:bg-red-700 border-red-700" :
                bulkActionType === "activate" ? "bg-green-600 hover:bg-green-700 border-green-700" :
                "bg-orange-600 hover:bg-orange-700 border-orange-700"
              } text-white`}
            >
              Confirmar {bulkActionType === "activate" ? "Ativação" : bulkActionType === "end" ? "Encerramento" : "Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para nova reunião criada */}
      <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
        <DialogContent className="bg-white border-sky-500">
          <DialogHeader>
            <DialogTitle className="text-sky-700 flex items-center">
              <span className="mr-2 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <Check className="h-5 w-5 text-green-600" /> 
              </span>
               Reunião Criada com Sucesso
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              A reunião foi criada. Use as informações abaixo para acessar ou compartilhar.
            </DialogDescription>
          </DialogHeader>
          {newMeetingData && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-sky-700">Código da Reunião</Label>
                <div className="flex items-center gap-2">
                  <Input value={newMeetingData.meeting_id} readOnly className="bg-sky-50 border-sky-300"/>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(newMeetingData.meeting_id)}
                    className="text-sky-600 border-sky-500 hover:bg-sky-100 hover:text-sky-700"
                  >
                    <Copy className="mr-1 h-4 w-4" /> Copiar Código
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-sky-700">URL da Reunião</Label>
                <div className="flex items-center gap-2">
                  <Input value={`${typeof window !== "undefined" ? window.location.origin : ""}/${newMeetingData.meeting_id}`} readOnly className="bg-sky-50 border-sky-300" />
                  <Button variant="outline" size="sm" onClick={() => copyMeetingUrl(newMeetingData.meeting_id)} className="text-sky-600 border-sky-500 hover:bg-sky-100 hover:text-sky-700">
                    <Copy className="mr-1 h-4 w-4" /> Copiar URL
                  </Button>
                </div>
              </div>
                 <div className="grid gap-2">
                <Label className="text-sky-700">URL do Vídeo</Label>
                <div className="flex items-center gap-2">
                  <Input value={newMeetingData.video_url} readOnly className="bg-sky-50 border-sky-300"/>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between gap-2">
             <Button variant="destructive" onClick={() => { if (newMeetingData) deleteMeeting(newMeetingData.meeting_id); setIsNewMeetingDialogOpen(false);}} className="bg-red-500 hover:bg-red-600 border-red-700 text-white">
                <Trash2 className="mr-2 h-4 w-4"/>Apagar Reunião
            </Button>
            <Button 
              onClick={() => setIsNewMeetingDialogOpen(false)} 
              className="bg-gray-800 hover:bg-gray-900 border border-gray-950 text-white"
            >
              <XCircle className="mr-2 h-4 w-4"/> Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de URL Padrão Salva */}
      <Dialog open={isUrlSaveConfirmDialogOpen} onOpenChange={setIsUrlSaveConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white border-sky-500">
          <DialogHeader className="items-center text-center">
            <span className="mb-3 p-2 bg-green-100 border border-green-300 rounded-md inline-block">
              <Check className="h-7 w-7 text-green-600" />
            </span>
            <DialogTitle className="text-sky-700 text-xl">URL Padrão Salva!</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center text-gray-600 py-3">
            A nova URL de vídeo padrão foi salva com sucesso e será usada para futuras reuniões.
          </DialogDescription>
          <DialogFooter className="sm:justify-center">
            <Button 
              type="button" 
              onClick={() => setIsUrlSaveConfirmDialogOpen(false)} 
              className="bg-sky-500 hover:bg-sky-600 text-white border-sky-700"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}