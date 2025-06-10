"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
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
import { useToast } from "@/hooks/use-toast"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
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
  CalendarIcon,
  Check,
  Ban,
  SquareCheck,
  SquareX,
  ClipboardCheck,
  X,
  RefreshCw,
  Eye,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface Meeting {
  id: number
  meeting_id: string
  status: string
  div_id: string
  thumb_id: string
  src_images_url: string
  src_scripts_url: string
  created_at: string
}

// Traduções de status
const statusTranslations = {
  active: "Ativado",
  watching: "Assistindo",
  ended: "Encerrado",
  Ativado: "active",
  Assistindo: "watching",
  Encerrado: "ended",
}

export default function AdminPanel() {
  const router = useRouter()
  const { toast } = useToast()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [defaultDivId, setDefaultDivId] = useState<string>("")
  const [defaultThumbId, setDefaultThumbId] = useState<string>("")
  const [defaultSrcImagesUrl, setDefaultSrcImagesUrl] = useState<string>("")
  const [defaultSrcScriptsUrl, setDefaultSrcScriptsUrl] = useState<string>("")
  const [newMeetingData, setNewMeetingData] = useState<Meeting | null>(null)
  const [isNewMeetingDialogOpen, setIsNewMeetingDialogOpen] = useState(false)
  const [selectedMeetings, setSelectedMeetings] = useState<string[]>([])
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<"activate" | "end" | "delete" | null>(null)
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [isToDatePickerOpen, setIsToDatePickerOpen] = useState(false)
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const customDateOverlayRef = useRef<HTMLDivElement>(null);
  const [isCustomDateOverlayOpen, setIsCustomDateOverlayOpen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Efeito para buscar os dados iniciais ao montar o componente
  useEffect(() => {
    const fetchInitialMeetings = async () => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          console.warn("Supabase client not initialized.");
          setMeetings([]);
          return;
        }

        const { data, error } = await supabase
          .from("meetings")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const translatedMeetings: Meeting[] = data.map((meeting: any) => ({
            ...meeting,
            status: meeting.status === 'active' ? 'Ativado' :
                    meeting.status === 'watching' ? 'Assistindo' :
                    meeting.status === 'ended' ? 'Encerrado' :
                    meeting.status
          }));
          setMeetings(translatedMeetings);
        } else if (error) {
          console.error("Error fetching meetings:", error);
        }
      } catch (error) {
        console.error("Error in admin panel:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialMeetings();
  }, []); // Executa apenas uma vez

  // Hook para refresh automático
  const handleDataUpdateFromAutoRefresh = useCallback((newMeetingsData: any[]) => {
    // Apenas atualiza o estado, não precisa de debounce aqui pois a causa do loop foi removida
    const translatedMeetings = newMeetingsData.map((meeting: any) => ({
      ...meeting,
      status: meeting.status === 'active' ? 'Ativado' : 
              meeting.status === 'watching' ? 'Assistindo' :
              meeting.status === 'ended' ? 'Encerrado' : 
              meeting.status
    }));
    setMeetings(translatedMeetings);
  }, []);

  const { refreshNow } = useAutoRefresh({
    onDataUpdate: handleDataUpdateFromAutoRefresh,
    intervalMs: 15000, // Aumentado para 15 segundos para ser mais leve
    enabled: autoRefreshEnabled
  });

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev)
  }, []);

  // Carregar URL padrão do localStorage ao iniciar
  useEffect(() => {
    const savedDivId = localStorage.getItem("defaultDivId") || "vid_6845f57d2f8fb6874f259443";
    const savedThumbId = localStorage.getItem("defaultThumbId") || "thumb_6845f57d2f8fb6874f259443";
    const savedImagesUrl = localStorage.getItem("defaultSrcImagesUrl") || "https://images.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6845f57d2f8fb6874f259443/thumbnail.jpg";
    const savedScriptsUrl = localStorage.getItem("defaultSrcScriptsUrl") || "https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6845f57d2f8fb6874f259443/player.js";

    setDefaultDivId(savedDivId);
    setDefaultThumbId(savedThumbId);
    setDefaultSrcImagesUrl(savedImagesUrl);
    setDefaultSrcScriptsUrl(savedScriptsUrl);

    // Save defaults if not present
    if (!localStorage.getItem("defaultDivId")) localStorage.setItem("defaultDivId", savedDivId);
    if (!localStorage.getItem("defaultThumbId")) localStorage.setItem("defaultThumbId", savedThumbId);
    if (!localStorage.getItem("defaultSrcImagesUrl")) localStorage.setItem("defaultSrcImagesUrl", savedImagesUrl);
    if (!localStorage.getItem("defaultSrcScriptsUrl")) localStorage.setItem("defaultSrcScriptsUrl", savedScriptsUrl);
  }, [])

  // Salvar valor padrão no localStorage
  const handleSetDefaultValue = (key: string, value: string) => {
      if(!value) {
        toast({
            title: "Valor inválido",
            description: "O campo não pode estar vazio.",
            variant: "destructive"
        })
        return;
      }

      localStorage.setItem(key, value);
      
      switch(key) {
          case "defaultDivId":
              setDefaultDivId(value);
              break;
          case "defaultThumbId":
              setDefaultThumbId(value);
              break;
          case "defaultSrcImagesUrl":
              setDefaultSrcImagesUrl(value);
              break;
          case "defaultSrcScriptsUrl":
              setDefaultSrcScriptsUrl(value);
              break;
      }

      toast({
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Valor padrão salvo com sucesso!</span>
            </div>
          ),
          variant: "success",
      });
  }

  // Controlar abertura/fechamento do overlay de data personalizada
  useEffect(() => {
    if (dateFilter === "custom") {
      setIsCustomDateOverlayOpen(true)
    } else {
      setIsCustomDateOverlayOpen(false)
      setCustomDateRange({}) // Limpa o intervalo quando fecha
    }
  }, [dateFilter])

  // Event listener para fechar overlay ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isCustomDateOverlayOpen &&
        customDateOverlayRef.current &&
        dateFilterRef.current &&
        !customDateOverlayRef.current.contains(event.target as Node) &&
        !dateFilterRef.current.contains(event.target as Node)
      ) {
        // Verificar se o clique foi em um popover de calendário
        const target = event.target as Element
        const isCalendarPopover = target.closest('[data-radix-popper-content-wrapper]') || 
                                  target.closest('.rdp') || 
                                  target.closest('[role="dialog"]') ||
                                  target.closest('[data-state="open"]')
        
        if (!isCalendarPopover) {
          setIsCustomDateOverlayOpen(false)
          setDateFilter("all") // Volta para "Qualquer data"
        }
      }
    }

    if (isCustomDateOverlayOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCustomDateOverlayOpen])

  // Filtrar reuniões com base no status, data e pesquisa - OTIMIZADO
  const filteredMeetings = useMemo(() => {
    if (!meetings || meetings.length === 0) return []
    
    return meetings.filter((meeting) => {
      // Status filter
      if (statusFilter !== "all" && meeting.status !== statusFilter) {
        return false
      }

      // Search filter primeiro para performance
      if (searchQuery.trim() !== "" && !meeting.meeting_id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Date filter
      if (dateFilter !== "all") {
        const meetingDate = new Date(meeting.created_at)
        const today = new Date()

        if (dateFilter === "today") {
          if (meetingDate.toDateString() !== today.toDateString()) {
            return false
          }
        } else if (dateFilter === "week") {
          const weekAgo = new Date()
          weekAgo.setDate(today.getDate() - 7)
          if (meetingDate < weekAgo) {
            return false
          }
        } else if (dateFilter === "month") {
          const monthAgo = new Date()
          monthAgo.setMonth(today.getMonth() - 1)
          if (meetingDate < monthAgo) {
            return false
          }
        } else if (dateFilter === "custom") {
          if (customDateRange.from && customDateRange.to) {
            const toDate = new Date(customDateRange.to)
            toDate.setHours(23, 59, 59, 999)
            if (!(meetingDate >= customDateRange.from && meetingDate <= toDate)) {
              return false
            }
          } else if (customDateRange.from) {
            if (meetingDate < customDateRange.from) {
              return false
            }
          } else if (customDateRange.to) {
            const toDate = new Date(customDateRange.to)
            toDate.setHours(23, 59, 59, 999)
            if (meetingDate > toDate) {
              return false
            }
          }
        }
      }

      return true
    })
  }, [meetings, statusFilter, dateFilter, customDateRange?.from, customDateRange?.to, searchQuery])

  // Função para selecionar/desselecionar todas as reuniões visíveis
  const toggleSelectAll = useCallback(() => {
    if (selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0) {
      setSelectedMeetings([])
    } else {
      setSelectedMeetings(filteredMeetings.map((m) => m.meeting_id))
    }
  }, [selectedMeetings, filteredMeetings])

  // Função para selecionar/desselecionar uma reunião individual
  const toggleSelectMeeting = useCallback((meetingId: string) => {
    setSelectedMeetings((prevSelected) =>
      prevSelected.includes(meetingId) ? prevSelected.filter((id) => id !== meetingId) : [...prevSelected, meetingId],
    )
  }, [])

  // Função para abrir o diálogo de ação em massa
  const openBulkActionDialog = useCallback((action: "activate" | "end" | "delete") => {
    setBulkActionType(action)
    setIsBulkActionDialogOpen(true)
  }, [])

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
        const newLocalStatus = bulkActionType === "activate" ? "Ativado" : "Encerrado"
        const supabasePersistStatus = statusTranslations[newLocalStatus as keyof typeof statusTranslations] || newLocalStatus
        
        const { error } = await supabase
          .from("meetings")
          .update({ status: supabasePersistStatus })
          .in("meeting_id", selectedMeetings)
        if (error) throw error
        setMeetings(
          meetings.map((m) => (selectedMeetings.includes(m.meeting_id) ? { ...m, status: newLocalStatus } : m)),
        )
        successMessage = `Reuniões selecionadas ${newLocalStatus === "Ativado" ? "ativadas" : "encerradas"} com sucesso.`
        errorMessage = `Erro ao ${newLocalStatus === "Ativado" ? "ativar" : "encerrar"} reuniões selecionadas.`
      }
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-green-100 border-green-400 text-green-500 mr-2 inline-flex items-center justify-center">
                <Check className="h-5 w-5" />
              </span>
              Ação em massa concluída
            </div>
            {successMessage}
          </React.Fragment>
        ),
        variant: "success",
      });
    } catch (error) {
      console.error(errorMessage, error)
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Erro na ação em massa
            </div>
            {`${errorMessage} Tente novamente.`}
          </React.Fragment>
        ),
        variant: "destructive",
      });
      errorOccurred = true
    }

    setSelectedMeetings([])
    setIsBulkActionDialogOpen(false)
    setBulkActionType(null)
  }

  const createMeeting = async () => {
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
        div_id: defaultDivId,
        thumb_id: defaultThumbId,
        src_images_url: defaultSrcImagesUrl,
        src_scripts_url: defaultSrcScriptsUrl,
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

      setNewMeetingData(newMeetingForState)
      setIsNewMeetingDialogOpen(true)
    } else if (error) {
      console.error("Erro ao criar reunião:", error)
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Erro ao criar reunião
            </div>
            Ocorreu um erro ao criar a reunião. Tente novamente.
          </React.Fragment>
        ),
        variant: "destructive",
      });
    }
  }

  const copyMeetingUrl = (meetingId: string, fromDialog: boolean = false) => {
    const url = `${window.location.origin}/${meetingId}`
    navigator.clipboard.writeText(url)
    toast({
      description: (
        <React.Fragment>
          <div className="flex items-center text-lg font-semibold mb-1">
            <span className="p-1 rounded-md border bg-green-100 border-green-400 text-green-500 mr-2 inline-flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            URL copiada
          </div>
          A URL da reunião foi copiada para a área de transferência.
        </React.Fragment>
      ),
      variant: "success",
    });

    if (fromDialog) {
      setIsUrlCopied(true);
      setTimeout(() => setIsUrlCopied(false), 1000);
    } else {
      setCopiedMeetingId(meetingId);
      setTimeout(() => setCopiedMeetingId(null), 1000);
    }
  }

  const endMeeting = async (meetingId: string) => {
    const supabase = getSupabaseBrowser()

    if (!supabase) {
      console.warn("Cliente Supabase não inicializado")
      return
    }
    // Atualiza para "ended" no Supabase, mas "Encerrado" localmente
    const { error } = await supabase.from("meetings").update({ status: "ended" }).eq("meeting_id", meetingId)

    if (!error) {
      setMeetings(
        meetings.map((meeting) => (meeting.meeting_id === meetingId ? { ...meeting, status: "Encerrado" } : meeting)),
      )
      
      toast({
        className: "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-900/50 dark:border-amber-700 dark:text-amber-300",
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-amber-100 border-amber-400 text-amber-600 mr-2 inline-flex items-center justify-center">
                <PowerOff className="h-5 w-5" />
              </span>
              Reunião Encerrada
            </div>
            {`A reunião ${meetingId} foi encerrada com sucesso.`}
          </React.Fragment>
        ),
      });
    } else {
      console.error("Erro ao encerrar reunião:", error)
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Erro ao Encerrar Reunião
            </div>
            Ocorreu um erro ao encerrar a reunião. Tente novamente.
          </React.Fragment>
        ),
        variant: "destructive",
      });
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
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </span>
              Reunião excluída
            </div>
            {`A reunião ${meetingId} foi excluída com sucesso.`}
          </React.Fragment>
        ),
        variant: "destructive",
      });
    } else {
      console.error("Erro ao excluir reunião:", error)
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Erro ao excluir reunião
            </div>
            Ocorreu um erro ao excluir a reunião. Tente novamente.
          </React.Fragment>
        ),
        variant: "destructive",
      });
    }
  }

  const activateMeeting = useCallback(async (meetingId: string) => {
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      console.warn("Cliente Supabase não inicializado")
      return
    }

    const { error } = await supabase
      .from("meetings")
      .update({ status: "active" })
      .eq("meeting_id", meetingId)

    if (!error) {
      setMeetings(meetings.map(m => 
        m.meeting_id === meetingId ? { ...m, status: 'Ativado' } : m
      ))
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-green-100 border-green-400 text-green-500 mr-2 inline-flex items-center justify-center">
                <Power className="h-5 w-5" />
              </span>
              Reunião Ativada
            </div>
            {`A reunião ${meetingId} foi reativada.`}
          </React.Fragment>
        ),
        variant: "success",
      });
    } else {
      toast({
        description: (
          <React.Fragment>
            <div className="flex items-center text-lg font-semibold mb-1">
              <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Erro ao Ativar
            </div>
            Não foi possível reativar a reunião.
          </React.Fragment>
        ),
        variant: "destructive",
      });
    }
  }, [meetings, toast])

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
        // Filtra localmente usando "Encerrado"
        setMeetings(meetings.filter((meeting) => meeting.status !== "Encerrado"))
        
        toast({
          description: (
            <React.Fragment>
              <div className="flex items-center text-lg font-semibold mb-1">
                <span className="p-1 rounded-md border bg-green-100 border-green-400 text-green-500 mr-2 inline-flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </span>
                Reuniões encerradas excluídas
              </div>
              Todas as reuniões com status "Encerrado" foram excluídas com sucesso.
            </React.Fragment>
          ),
          variant: "success",
        });
      } else {
        console.error("Erro ao excluir reuniões encerradas:", error)
        toast({
          description: (
            <React.Fragment>
              <div className="flex items-center text-lg font-semibold mb-1">
                <span className="p-1 rounded-md border bg-red-100 border-red-400 text-red-500 mr-2 inline-flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                Erro ao excluir reuniões
              </div>
              Ocorreu um erro ao excluir as reuniões com status "Encerrado". Tente novamente.
            </React.Fragment>
          ),
          variant: "destructive",
        });
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Adiciona o retorno do loading UI
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-700 mx-auto mb-4"></div>
            <p className="text-sky-700 font-medium">Carregando reuniões...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <Toaster />
      <header className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-700">Painel de Administração de Reuniões</h1>
        <p className="text-gray-600 mt-1">Gerencie suas reuniões de forma eficiente.</p>
      </header>

      {/* Ações principais e Configurações */}
      <div className="mb-6 flex flex-col gap-4">
        <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-sky-100 border border-sky-500 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Button onClick={createMeeting} className="bg-sky-500 hover:bg-sky-600 text-white border border-sky-500 shadow-inner shadow-sky-200">
                      <PlusCircle className="mr-2 h-5 w-5" /> Criar Reunião
                    </Button>
                    <div className="flex items-center gap-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleAutoRefresh}
                                className={cn(
                                  "flex items-center gap-2 transition-all duration-200",
                                  autoRefreshEnabled
                                    ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                                    : "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100",
                                )}
                              >
                                <RefreshCw
                                  className={cn("h-4 w-4", autoRefreshEnabled && "animate-spin")}
                                />
                                <span className="sm:inline">
                                  {autoRefreshEnabled ? "Auto-Refresh Ativo" : "Pausado"}
                                </span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {autoRefreshEnabled
                                  ? "Pausar atualização automática"
                                  : "Ativar atualização automática"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshNow}
                          className="flex items-center gap-2 bg-sky-50 border-sky-300 text-sky-700 hover:bg-sky-100"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="sm:inline">Atualizar Agora</span>
                        </Button>
                    </div>
                </div>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-center gap-2 text-sky-700 hover:bg-sky-200 border-2 border-sky-300 hover:border-sky-500 md:border-0 p-2.5 md:p-2 rounded-lg shadow-inner shadow-sky-300 hover:text-sky-800 hover:shadow-sky-400">
                        <Settings className={cn("h-5 w-5 transition-transform duration-300", isSettingsOpen && "rotate-90")} />
                        <span>Mudar script do vídeo</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
                <div className="p-4 bg-sky-50 border border-sky-300 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-sky-800 mb-3">Configurar Vídeo Padrão</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Div ID */}
                      <div>
                        <Label htmlFor="default-div-id" className="text-sky-700">Div ID Padrão</Label>
                        <Input
                          id="default-div-id"
                          type="text"
                          defaultValue={defaultDivId}
                          onBlur={(e) => handleSetDefaultValue("defaultDivId", e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { handleSetDefaultValue("defaultDivId", e.currentTarget.value) }}}
                          placeholder="vid_..."
                          className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Exemplo: `&lt;div id="<strong className="text-sky-700">vid_6845f57d2f8fb6874f259443</strong>"&gt;`
                        </p>
                      </div>

                      {/* Thumb ID */}
                      <div>
                        <Label htmlFor="default-thumb-id" className="text-sky-700">Thumbnail ID Padrão</Label>
                        <Input
                          id="default-thumb-id"
                          type="text"
                          defaultValue={defaultThumbId}
                          onBlur={(e) => handleSetDefaultValue("defaultThumbId", e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { handleSetDefaultValue("defaultThumbId", e.currentTarget.value) }}}
                          placeholder="thumb_..."
                          className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Exemplo: `&lt;img id="<strong className="text-sky-700">thumb_6845f57d2f8fb6874f259443</strong>" src="..."&gt;`
                        </p>
                      </div>
                      
                      {/* Image URL */}
                      <div className="md:col-span-2">
                        <Label htmlFor="default-image-url" className="text-sky-700">URL da Imagem de Thumbnail Padrão</Label>
                        <Input
                          id="default-image-url"
                          type="text"
                          defaultValue={defaultSrcImagesUrl}
                          onBlur={(e) => handleSetDefaultValue("defaultSrcImagesUrl", e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { handleSetDefaultValue("defaultSrcImagesUrl", e.currentTarget.value) }}}
                          placeholder="https://images.converteai.net/..."
                          className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Exemplo: `&lt;img ... src="<strong className="text-sky-700">https://images.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6845f57d2f8fb6874f259443/thumbnail.jpg</strong>"&gt;`
                        </p>
                      </div>
                      
                      {/* Script URL */}
                      <div className="md:col-span-2">
                        <Label htmlFor="default-script-url" className="text-sky-700">URL do Script do Player Padrão</Label>
                        <Input
                          id="default-script-url"
                          type="text"
                          defaultValue={defaultSrcScriptsUrl}
                          onBlur={(e) => handleSetDefaultValue("defaultSrcScriptsUrl", e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { handleSetDefaultValue("defaultSrcScriptsUrl", e.currentTarget.value) }}}
                          placeholder="https://scripts.converteai.net/..."
                          className="mt-1 border-sky-400 focus:border-sky-600 focus:ring-sky-600 bg-white"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Exemplo: `&lt;script ... src="<strong className="text-sky-700">https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6845f57d2f8fb6874f259443/player.js</strong>"&gt;&lt;/script&gt;`
                        </p>
                      </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
        <p className="text-xs text-gray-500 -mt-2">
          Nota: A atualização automática pode não funcionar corretamente em alguns casos e pode ser necessário atualizar manualmente.
        </p>
      </div>

      {/* Filtros e Ações em Massa */}
      <div className="mb-6 p-4 bg-sky-100 border border-sky-500 rounded-lg shadow-md">
        <div className="mt-2 px-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 items-start">
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
                <SelectItem value="Ativado" className="hover:bg-sky-200 flex items-center">
                  <div className="flex items-center gap-2">
                    <Power className="h-3 w-3 text-green-600" />
                    Ativado
                  </div>
                </SelectItem>
                <SelectItem value="Assistindo" className="hover:bg-sky-200 flex items-center">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3 text-blue-700" />
                    Assistindo
                  </div>
                </SelectItem>
                <SelectItem value="Encerrado" className="hover:bg-sky-200 flex items-center">
                  <div className="flex items-center gap-2">
                    <PowerOff className="h-3 w-3 text-amber-600" />
                    Encerrado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-filter" className="text-sky-700 flex items-center">
              <CalendarDays className="mr-2 h-4 w-4 text-sky-600" /> Filtrar por Data
            </Label>
            <div ref={dateFilterRef}>
              <Select
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(value)
                  if (value !== "custom") {
                    setCustomDateRange({}) // Limpa o intervalo personalizado se outra opção for selecionada
                    setIsCustomDateOverlayOpen(false)
                  }
                }}
                onOpenChange={(open) => {
                  if (open && isCustomDateOverlayOpen) {
                    // Quando o dropdown abre, fecha o overlay de data personalizada
                    setIsCustomDateOverlayOpen(false)
                  } else if (!open && dateFilter === "custom" && !isCustomDateOverlayOpen) {
                    // Quando o dropdown fecha e ainda está em "custom", reabre o overlay
                    setIsCustomDateOverlayOpen(true)
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
            </div>
            {isCustomDateOverlayOpen && dateFilterRef.current && createPortal(
              <div 
                ref={customDateOverlayRef}
                className="fixed z-[9999] bg-sky-50 border border-sky-300 rounded-md shadow-xl p-3"
                style={{
                  top: dateFilterRef.current.getBoundingClientRect().bottom + window.scrollY + 5,
                  left: dateFilterRef.current.getBoundingClientRect().left + window.scrollX,
                  width: dateFilterRef.current.getBoundingClientRect().width,
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      <PopoverContent 
                        className="!fixed !z-[9999] w-auto p-0 bg-white border-sky-500 shadow-xl rounded-lg" 
                        side="bottom" 
                        align="start" 
                        sideOffset={5}
                        style={{ position: 'fixed' }}
                      >
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
                      <PopoverContent 
                        className="!fixed !z-[9999] w-auto p-0 bg-white border-sky-500 shadow-xl rounded-lg" 
                        side="bottom" 
                        align="start" 
                        sideOffset={5}
                        style={{ position: 'fixed' }}
                      >
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
              </div>,
              document.body
            )}
          </div>

          {/* Botão para Excluir Reuniões Encerradas */} 
          <div className="mt-auto"> {/* Alterado para alinhar o botão na parte inferior */} 
            {meetings.some((m) => m.status === "Encerrado") && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full bg-red-100 text-red-700 border-red-400 hover:bg-red-200 hover:border-red-500 hover:text-red-700"
                      disabled={isDeleting}
                      title="Excluir todas as reuniões com status Encerrado"
                    >
                      <Trash2 className="mr-2 h-4" /> Excluir Reuniões Encerradas
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border-red-500">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-700 flex items-center">
                        <span className="mr-2 p-1.5 bg-red-100 border border-red-300 rounded-md">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </span>
                        Excluir Reuniões Encerradas
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600 pt-2">
                        Tem certeza que deseja excluir <strong>TODAS</strong> as reuniões com status <strong>"Encerrado"</strong>?
                        <br />Esta ação <strong>NÃO</strong> pode ser desfeita.
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
                        <Trash2 className="mr-2 h-4" /> {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
          </div> 
        </div>

        {selectedMeetings.length > 0 && (
          <div className="mt-4 p-4 bg-amber-100 border border-amber-500 rounded-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-amber-800">
                  {selectedMeetings.length} {selectedMeetings.length === 1 ? "reunião selecionada" : "reuniões selecionadas"}
                </h3>
                <Button 
                  variant="link"
                  onClick={() => setSelectedMeetings([])} 
                  className="ml-2 sm:ml-3 px-2.5 py-1 text-xs h-auto rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800 border border-gray-400 focus:ring-1 focus:ring-gray-500"
                  title="Limpar seleção"
                >
                  <XCircle className="h-3.5 w-3.5" /> Limpar seleção
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => openBulkActionDialog("activate")}
                className="bg-green-200 hover:bg-green-300 text-green-800 border border-green-600 w-full sm:w-auto"
              >
                <Power className="mr-2 h-5 w-5" /> Ativar Selecionadas
              </Button>
              <Button
                onClick={() => openBulkActionDialog("end")}
                className="bg-amber-200 hover:bg-amber-300 text-amber-800 border border-amber-500 w-full sm:w-auto"
              >
                <PowerOff className="mr-2 h-5 w-5" /> Encerrar Selecionadas
              </Button>
              <Button
                onClick={() => openBulkActionDialog("delete")}
                className="bg-red-100 hover:bg-red-200 text-red-700 border border-red-500 w-full sm:w-auto"
              >
                <Trash2 className="mr-2 h-5 w-5" /> Excluir Selecionadas
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              A ação escolhida abaixo será aplicada a todas as reuniões marcadas na tabela.
            </p>
          </div>
        )}
      </div>

      {/* Tabela de Reuniões */}
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-sky-300">
        <Table>
          <TableHeader className="bg-sky-100">
            <TableRow className="border-b-sky-400">
              <TableHead className="w-[50px] text-center px-1 py-3 sm:px-2">
                <Checkbox
                  checked={selectedMeetings.length === filteredMeetings.length && filteredMeetings.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Selecionar todas as reuniões"
                  className="border-sky-500 data-[state=checked]:bg-sky-500 data-[state=checked]:text-white"
                />
              </TableHead>
              <TableHead className="text-sky-800 font-semibold px-2 py-3 sm:px-4">
                <div className="flex items-center">
                  <Hash className="mr-2 h-4 w-4 text-sky-600" /> ID da Reunião
                </div>
              </TableHead>
              <TableHead className="text-sky-800 font-semibold hidden sm:table-cell px-2 py-3 sm:px-4">
                <div className="flex items-center">
                  <ToggleRight className="mr-2 h-4 w-4 text-sky-600" /> Status
                </div>
              </TableHead>
              <TableHead className="text-sky-800 font-semibold px-2 py-3 sm:px-4">
                <div className="flex items-center">
                  <CalendarPlus className="mr-2 h-4 w-4 text-sky-600" /> Data de Criação
                </div>
              </TableHead>
              <TableHead className="text-right text-sky-800 font-semibold px-2 py-3 sm:px-4 sm:pr-6">
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
                <TableRow 
                  key={meeting.id} 
                  className={cn(
                    "border-b-sky-200 hover:bg-sky-50",
                    // Cores de fundo baseadas no status
                    meeting.status === "Ativado" ? "bg-green-100 opacity-90" :
                    meeting.status === "Assistindo" ? "bg-blue-100 opacity-90" :
                    meeting.status === "Encerrado" ? "bg-amber-50 opacity-100" : ""
                  )}
                >
                  <TableCell className="text-center px-1 py-2 sm:px-2">
                    <Checkbox
                      checked={selectedMeetings.includes(meeting.meeting_id)}
                      onCheckedChange={() => toggleSelectMeeting(meeting.meeting_id)}
                      aria-label={`Selecionar reunião ${meeting.meeting_id}`}
                      className="border-sky-500 data-[state=checked]:bg-sky-500 data-[state=checked]:text-white"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-sky-700 px-2 py-2 sm:px-4">
                    <div className="flex items-center">
                      <div className="sm:hidden mr-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {meeting.status === "Ativado" ? (
                                <div className="w-1 h-3 rounded-sm bg-green-500" />
                              ) : meeting.status === "Assistindo" ? (
                                <div className="w-1 h-3 rounded-sm bg-blue-600" />
                              ) : (
                                <div className="w-1 h-3 rounded-sm bg-amber-500" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-800 text-white border-gray-900">
                              <p>{meeting.status}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {meeting.meeting_id}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("ml-2 text-sky-600 hover:text-sky-800 p-1 h-auto", copiedMeetingId === meeting.meeting_id && "bg-sky-100 ring-1 ring-sky-300")}
                        onClick={() => copyMeetingUrl(meeting.meeting_id)}
                        title={copiedMeetingId === meeting.meeting_id ? "URL Copiada!" : "Copiar URL da reunião"}
                      >
                        {copiedMeetingId === meeting.meeting_id ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell px-2 py-2 sm:px-4">
                    <div className="flex items-center justify-start">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border sm:min-w-[100px] sm:text-center flex items-center justify-center gap-1 ${ 
                          meeting.status === "Ativado"
                            ? "bg-green-100 text-green-700 border-green-500"
                            : meeting.status === "Assistindo"
                            ? "bg-blue-200 text-blue-800 border-blue-600"
                            : "bg-amber-100 text-amber-700 border-amber-500"
                        }`}
                      >
                        {meeting.status === "Ativado" ? (
                          <Power className="h-3 w-3" />
                        ) : meeting.status === "Assistindo" ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <PowerOff className="h-3 w-3" />
                        )}
                        {meeting.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 px-2 py-2 sm:px-4">
                    {new Date(meeting.created_at).toLocaleDateString("pt-BR")} {new Date(meeting.created_at).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit'})}
                  </TableCell>
                  <TableCell className="text-right px-2 py-2 sm:px-4 sm:pr-4">
                    <div className="flex justify-end space-x-2">
                      <Button
                        className="h-9 w-9 p-0 flex items-center justify-center text-blue-700 bg-blue-200 border-blue-600 hover:bg-blue-300 hover:text-blue-800 sm:w-32 sm:px-3"
                        onClick={() => window.open(`/${meeting.meeting_id}`, '_blank')}
                        title="Visualizar Reunião"
                      >
                        <ExternalLink className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </Button>
                      {meeting.status === "Ativado" ? (
                        <Button
                          className="h-9 w-9 p-0 flex items-center justify-center text-amber-700 bg-amber-200 border-amber-500 hover:bg-amber-300 hover:text-amber-800 sm:w-32 sm:px-3"
                          onClick={() => endMeeting(meeting.meeting_id)}
                          title="Encerrar Reunião"
                        >
                          <PowerOff className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Encerrar</span>
                        </Button>
                      ) : (
                         <Button
                          className="h-9 w-9 p-0 flex items-center justify-center text-green-700 bg-green-200 border-green-600 hover:bg-green-300 hover:text-green-800 sm:w-32 sm:px-3"
                          onClick={() => activateMeeting(meeting.meeting_id)}
                          title="Ativar Reunião"
                        >
                          <Power className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Ativar</span>
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="h-9 w-9 p-0 flex items-center justify-center text-red-700 bg-red-200 border-red-500 hover:bg-red-300 hover:text-red-800 sm:w-32 sm:px-3"
                            title="Excluir Reunião"
                          >
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Excluir</span>
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
                              Tem certeza que deseja excluir a reunião <strong className="text-red-600">{meeting.meeting_id}</strong>? <br />Esta ação <strong>NÃO</strong> pode ser desfeita.
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
        <AlertDialogContent className={`p-0 rounded-lg overflow-hidden ${
          bulkActionType === "delete" ? "border-gray-500" : 
          bulkActionType === "activate" ? "border-green-500" : 
          bulkActionType === "end" ? "border-amber-500" : "border-sky-500" 
        } ${ 
          bulkActionType === "delete" ? "bg-gray-50" :
          bulkActionType === "activate" ? "bg-green-50" :
          bulkActionType === "end" ? "bg-amber-50" : "bg-sky-50"
        }`}>
          <div className="p-6 pb-4">
            <AlertDialogHeader className={`pb-0 border-none`}>
              <AlertDialogTitle className={`flex items-center ${
                bulkActionType === 'activate' ? 'text-green-800' :
                bulkActionType === 'end' ? 'text-amber-800' :
                bulkActionType === 'delete' ? 'text-gray-800' : 'text-sky-700'
              }`}>
                <span className={`mr-2 p-1.5 rounded-md border ${ 
                  bulkActionType === 'activate' ? 'bg-green-100 border-green-300 text-green-700' :
                  bulkActionType === 'end' ? 'bg-amber-100 border-amber-300 text-amber-700' :
                  bulkActionType === 'delete' ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-sky-100 border-sky-300 text-sky-700'
                }`}>
                  {bulkActionType === 'activate' && <Power className="h-5 w-5" />}
                  {bulkActionType === 'end' && <PowerOff className="h-5 w-5" />}
                  {bulkActionType === 'delete' && <Trash2 className="h-5 w-5" />}
                </span>
                { bulkActionType === 'activate' ? 'Ativar Reuniões Selecionadas' : 
                  bulkActionType === 'end' ? 'Encerrar Reuniões Selecionadas' : 
                  bulkActionType === 'delete' ? 'Excluir Reuniões Selecionadas' : 'Ação em Massa' }
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-700 pt-3">
                Você selecionou <strong className={`${ 
                  bulkActionType === 'activate' ? 'text-green-700' :
                  bulkActionType === 'end' ? 'text-amber-700' :
                  bulkActionType === 'delete' ? 'text-gray-700' : 'text-sky-700'
                }`}>{selectedMeetings.length}</strong> {selectedMeetings.length === 1 ? "reunião selecionada" : "reuniões selecionadas"}. 
                {bulkActionType === "delete" 
                  ? "Esta ação é irreversível. Todas as informações das reuniões selecionadas serão permanentemente excluídas." 
                  : bulkActionType === "activate"
                  ? "As reuniões selecionadas serão marcadas como 'Ativado'."
                  : "As reuniões selecionadas serão marcadas como 'Encerrado'."}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="bg-white/50 px-6 py-4 border-t border-gray-200">
            <AlertDialogCancel asChild>
              <Button variant="outline" className="border-gray-400 text-gray-700 hover:bg-gray-100">Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={`flex items-center ${
                bulkActionType === "delete" ? "bg-red-100 hover:bg-red-200 text-red-700 border border-red-500" :
                bulkActionType === "activate" ? "bg-green-200 hover:bg-green-300 text-green-800 border border-green-600" :
                "bg-amber-200 hover:bg-amber-300 text-amber-800 border border-amber-500"
              }`}
            >
              {bulkActionType === 'activate' && <Power className="mr-2 h-4 w-4" />}
              {bulkActionType === 'end' && <PowerOff className="mr-2 h-4 w-4" />}
              {bulkActionType === 'delete' && <Trash2 className="mr-2 h-4 w-4" />}
              { bulkActionType === 'activate' ? 'Confirmar Ativação' : 
                bulkActionType === 'end' ? 'Confirmar Encerramento' :
                bulkActionType === 'delete' ? 'Confirmar Exclusão' : 'Confirmar' }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para nova reunião criada */}
      <Dialog open={isNewMeetingDialogOpen} onOpenChange={setIsNewMeetingDialogOpen}>
        <DialogContent className="bg-sky-100 border-sky-500">
          <DialogHeader className="items-center text-center pt-6 pb-4">
            <div className="p-3 bg-sky-200/50 border-2 border-sky-500 rounded-lg mb-3 inline-flex">
              <Check className="h-8 w-8 text-sky-600 stroke-[2.5]" />
            </div>
            <DialogTitle className="text-sky-700 text-2xl font-bold">
               Reunião Criada com Sucesso
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 px-6 py-2 text-sm">
              A reunião foi criada. Use as informações abaixo para acessar ou compartilhar.
            </DialogDescription>
          </DialogHeader>
          {newMeetingData && (
            <div className="grid gap-4 py-4 px-6 bg-sky-200 border border-sky-500 rounded-lg">
              <div className="grid gap-2">
                <Label className="text-sky-700">Código da Reunião</Label>
                <div className="flex items-center gap-2">
                  <Input value={newMeetingData.meeting_id} readOnly className="bg-sky-50 border-sky-300"/>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!newMeetingData) return;
                      navigator.clipboard.writeText(newMeetingData.meeting_id);
                      toast({
                        description: (
                          <React.Fragment>
                            <div className="flex items-center text-lg font-semibold mb-1">
                              <span className="p-1 rounded-md border bg-green-100 border-green-400 text-green-500 mr-2 inline-flex items-center justify-center">
                                <ClipboardCheck className="h-5 w-5" />
                              </span>
                              Código Copiado
                            </div>
                            O código da reunião foi copiado para a área de transferência.
                          </React.Fragment>
                        ),
                        variant: "success",
                      });
                      setIsCodeCopied(true);
                      setTimeout(() => setIsCodeCopied(false), 1000);
                    }}
                    className={cn("text-sky-600 border-sky-500 hover:bg-sky-100 hover:text-sky-700", isCodeCopied && "bg-sky-100 ring-1 ring-sky-300")}
                  >
                    {isCodeCopied ? <ClipboardCheck className="mr-1 h-4 w-4 text-green-500" /> : <Copy className="mr-1 h-4 w-4" />}
                    {isCodeCopied ? "Copiado!" : "Copiar Código"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-sky-700">URL da Reunião</Label>
                <div className="flex items-center gap-2">
                  <Input value={`${typeof window !== "undefined" ? window.location.origin : ""}/${newMeetingData.meeting_id}`} readOnly className="bg-sky-50 border-sky-300" />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (!newMeetingData) return;
                      copyMeetingUrl(newMeetingData.meeting_id, true);
                    }} 
                    className={cn("text-sky-600 border-sky-500 hover:bg-sky-100 hover:text-sky-700", isUrlCopied && "bg-sky-100 ring-1 ring-sky-300")}
                  >
                    {isUrlCopied ? <ClipboardCheck className="mr-1 h-4 w-4 text-green-500" /> : <Copy className="mr-1 h-4 w-4" />}
                    {isUrlCopied ? "Copiado!" : "Copiar URL"}
                  </Button>
                </div>
              </div>
                 <div className="grid gap-2">
                <Label className="text-sky-700">Div ID do Vídeo</Label>
                <div className="flex items-center gap-2">
                  <Input value={newMeetingData.div_id || "Nenhum ID fornecido"} readOnly className="bg-sky-50 border-sky-300"/>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between gap-2">
             <Button 
                variant="outline" // Changed variant to outline for custom styling
                onClick={() => { if (newMeetingData) deleteMeeting(newMeetingData.meeting_id); setIsNewMeetingDialogOpen(false);}} 
                className="bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border-red-500 hover:border-red-600"
             >
                <Trash2 className="mr-2 h-4"/>Excluir Reunião
            </Button>
            <Button 
              onClick={() => setIsNewMeetingDialogOpen(false)} 
              className="bg-neutral-800 hover:bg-neutral-900 border border-neutral-950 text-neutral-100"
            >
              <X className="mr-2 h-4 w-4"/> Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}