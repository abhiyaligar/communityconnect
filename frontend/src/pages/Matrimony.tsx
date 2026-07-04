import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { MatrimonyEntry } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MapPin, Briefcase, Calendar, Search, Loader2, User, Star, Coffee, Users, Phone, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function Matrimony() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [selectedMatch, setSelectedMatch] = useState<MatrimonyEntry | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ["matrimony"],
    queryFn: async () => {
      const res = await api.get<MatrimonyEntry[]>("/matrimony/matches")
      return res.data
    },
  })

  const filtered = profiles?.filter((p) =>
    p.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.occupation?.toLowerCase().includes(search.toLowerCase())
  )

  const handleConnect = async (profileId: string) => {
    setConnectingId(profileId)
    try {
      await api.post("/matrimony/requests", { receiver_profile_id: profileId })
      toast.success("Connection request sent successfully!")
      refetch()
      if (selectedMatch && selectedMatch.profile_id === profileId) {
        setSelectedMatch((prev) => prev ? { ...prev, connection_status: "pending_self_approval" } : null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to send connection request.")
    } finally {
      setConnectingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] py-0 px-2 font-medium">
            Connected ✓
          </Badge>
        )
      case "pending_self_approval":
      case "pending_family_approval":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-[10px] py-0 px-2 font-medium">
            Requested
          </Badge>
        )
      case "declined_by_self":
      case "declined_by_family":
        return (
          <Badge variant="destructive" className="text-[10px] py-0 px-2 font-medium">
            Declined
          </Badge>
        )
      default:
        return null
    }
  }

  const isOptedIn = !!user?.matrimony?.opted_in
  const approvedWards = user?.wards?.filter(w => w.approved) || []
  const hasWards = approvedWards.length > 0

  if (user && !isOptedIn && !hasWards) {
    return (
      <div className="min-h-screen bg-background pt-32 px-4 flex items-center justify-center">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border-4 border-rose-500/20">
            <Heart className="h-10 w-10 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold">Matrimony Matches</h1>
          <p className="text-muted-foreground text-lg">
            You must opt-in and complete your Matrimony profile before you can browse other eligible members in the community.
          </p>
          <Link to="/matrimony/edit" className="block mt-8">
            <Button size="lg" className="w-full">
              Complete Matrimony Profile
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {!isOptedIn && hasWards && (
          <div className="mb-6 p-4 border border-purple-500/20 bg-purple-500/5 rounded-xl flex items-center gap-3 animate-fade-in">
            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 animate-pulse" />
            <div className="text-xs sm:text-sm">
              <span className="font-semibold text-purple-900 dark:text-purple-300">Guardian Mode: </span>
              <span className="text-purple-700 dark:text-purple-400">
                Browsing matches on behalf of your ward{approvedWards.length > 1 ? 's' : ''}:{" "}
                <span className="font-semibold">{approvedWards.map(w => `${w.full_name} (@${w.username})`).join(", ")}</span>.
              </span>
            </div>
          </div>
        )}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-rose-500/10 flex items-center justify-center">
                <Heart className="h-4 w-4 text-rose-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Matrimony Matches</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Browse verified members who have opted in for matrimonial connections within the community.
            </p>
          </div>
          
          <Link to="/matrimony/requests">
            <Button variant="outline" className="text-xs h-9">
              Manage Requests
            </Button>
          </Link>
        </div>

        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search matches..."
            className="pl-9 h-10 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}

        {/* Results */}
        {!isLoading && (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {filtered?.length || 0} profiles found
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered?.map((entry) => {
                const prof = entry.profile
                const initials = prof?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                const age = prof?.date_of_birth
                  ? Math.floor((Date.now() - new Date(prof.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                  : null

                return (
                  <Card 
                    key={entry.profile_id} 
                    className="border border-border shadow-none bg-card hover:border-foreground/20 transition-colors cursor-pointer flex flex-col justify-between"
                    onClick={() => setSelectedMatch(entry)}
                  >
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-12 w-12 border border-border">
                            <AvatarImage src={prof?.profile_photo_url} />
                            <AvatarFallback className="bg-muted text-foreground text-sm font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{prof?.full_name}</h3>
                            {prof?.username && (
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">@{prof.username}</p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {age && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{age} yrs</Badge>}
                              {prof?.gender && <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize font-normal">{prof.gender}</Badge>}
                              {prof?.marital_status && <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize font-normal">{prof.marital_status}</Badge>}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {entry.connection_status === "approved" ? prof?.address : "Hidden until connected"}
                            </span>
                          </div>
                          {prof?.occupation && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Briefcase className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{prof.occupation}</span>
                            </div>
                          )}
                          {prof?.date_of_birth && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{new Date(prof.date_of_birth).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {entry.about_me && (
                          <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border/30 pt-3">
                            {entry.about_me}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-border/30">
                        {entry.connection_status && entry.connection_status !== "none" ? (
                          <>
                            {getStatusBadge(entry.connection_status)}
                            <Button size="sm" variant="outline" className="text-xs h-8">View</Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            className="w-full text-xs h-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConnect(entry.profile_id)
                            }}
                            disabled={connectingId === entry.profile_id}
                          >
                            {connectingId === entry.profile_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Connect"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {filtered?.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground text-sm">No profiles match your search.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Full Profile Details Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border border-border bg-card">
          {selectedMatch && (
            <>
              <DialogHeader className="pb-4 border-b border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Avatar className="h-16 w-16 border border-border">
                      <AvatarImage src={selectedMatch.profile?.profile_photo_url} />
                      <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                        {selectedMatch.profile?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <DialogTitle className="text-xl font-bold">{selectedMatch.profile?.full_name}</DialogTitle>
                      {selectedMatch.profile?.username && (
                        <p className="text-xs text-muted-foreground font-mono">@{selectedMatch.profile.username}</p>
                      )}
                      <DialogDescription className="text-xs flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {selectedMatch.profile?.date_of_birth && (
                          <Badge variant="secondary" className="text-[10px]">
                            {Math.floor((Date.now() - new Date(selectedMatch.profile.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} yrs
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] capitalize font-normal">{selectedMatch.profile?.gender}</Badge>
                        <Badge variant="outline" className="text-[10px] capitalize font-normal">{selectedMatch.profile?.marital_status}</Badge>
                      </DialogDescription>
                    </div>
                  </div>
                  
                  <div>
                    {selectedMatch.connection_status === "none" || !selectedMatch.connection_status ? (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(selectedMatch.profile_id)}
                        disabled={connectingId === selectedMatch.profile_id}
                        className="text-xs"
                      >
                        {connectingId === selectedMatch.profile_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
                      </Button>
                    ) : (
                      getStatusBadge(selectedMatch.connection_status)
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8 pt-4 text-sm">
                {/* About Me */}
                {selectedMatch.about_me && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">About Me</h4>
                    <p className="text-foreground leading-relaxed bg-secondary/30 p-3.5 rounded-lg border border-border/50">{selectedMatch.about_me}</p>
                  </div>
                )}

                {/* Contact Details */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-foreground" /> Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Contact Number</p>
                      {selectedMatch.connection_status === "approved" ? (
                        <p className="font-semibold text-xs mt-0.5">{selectedMatch.profile?.contact_number || "—"}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 italic flex items-center gap-1">
                          🔒 Hidden until connected
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Address</p>
                      {selectedMatch.connection_status === "approved" ? (
                        <p className="font-semibold text-xs mt-0.5">{selectedMatch.profile?.address || "—"}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 italic flex items-center gap-1">
                          🔒 Hidden until connected
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal & Physical */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4 text-foreground" /> Personal Details
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Height</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.height_cm ? `${selectedMatch.matrimony_details.height_cm} cm` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Body Type</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.body_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Complexion</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.complexion || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Horoscope */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-foreground" /> Horoscope & Astro
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Gotra</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.gotra || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Rashi</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.rashi || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Nakshatra</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.nakshatra || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Manglik</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.manglik_status || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Professional */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-foreground" /> Education & Career
                  </h4>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Qualification</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.highest_qualification || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Field of Study</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.field_of_study || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Employment Type</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.employment_type?.replace(/_/g, " ") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Income Range</p>
                      <p className="font-semibold text-xs mt-0.5 uppercase">{selectedMatch.matrimony_details?.income_range?.replace(/_/g, " ") || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Family Details */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-foreground" /> Family details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Father's Name</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.father_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Father's Occupation</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.father_occupation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Mother's Name</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.mother_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Mother's Occupation</p>
                      <p className="font-semibold text-xs mt-0.5">{selectedMatch.matrimony_details?.mother_occupation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Siblings</p>
                      <p className="font-semibold text-xs mt-0.5">
                        Brothers: {selectedMatch.matrimony_details?.brothers_count || "0"} ({selectedMatch.matrimony_details?.brothers_marital_status || "—"}), 
                        Sisters: {selectedMatch.matrimony_details?.sisters_count || "0"} ({selectedMatch.matrimony_details?.sisters_marital_status || "—"})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Family Details</p>
                      <p className="font-semibold text-xs mt-0.5">
                        {selectedMatch.matrimony_details?.family_type || "—"} Type, {selectedMatch.matrimony_details?.family_values || "—"} Values
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lifestyle & Hobbies */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Coffee className="h-4 w-4 text-foreground" /> Lifestyle & Preferences
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Diet</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.diet || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Smoking</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.smoking || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Drinking</p>
                      <p className="font-semibold text-xs mt-0.5 capitalize">{selectedMatch.matrimony_details?.drinking || "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Hobbies / Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedMatch.hobbies && selectedMatch.hobbies.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Hobbies</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedMatch.hobbies.map((h) => (
                          <Badge key={h} variant="secondary" className="text-[10px] font-normal">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedMatch.languages && selectedMatch.languages.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Languages</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {selectedMatch.languages.map((l) => (
                          <Badge key={l} variant="secondary" className="text-[10px] font-normal">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Photos */}
                {selectedMatch.connection_status === "approved" && selectedMatch.matrimony_details?.additional_photos && selectedMatch.matrimony_details.additional_photos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Additional Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedMatch.matrimony_details.additional_photos.map((photo: string, i: number) => (
                        <img key={i} src={photo} alt={`Additional ${i}`} className="w-full h-32 object-cover rounded-lg border border-border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
