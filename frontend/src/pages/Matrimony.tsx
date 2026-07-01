import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { MatrimonyEntry } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MapPin, Briefcase, Calendar, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function Matrimony() {
  const [search, setSearch] = useState("")

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["matrimony"],
    queryFn: async () => {
      const res = await api.get<MatrimonyEntry[]>("/admin/matrimony")
      return res.data
    },
  })

  const filtered = profiles?.filter((p) =>
    p.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.address?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.occupation?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Heart className="h-5 w-5 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold">Matrimony</h1>
          </div>
          <p className="text-muted-foreground">
            Browse verified members who have opted in for matrimonial connections within the community.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, occupation..."
            className="pl-9 h-11"
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered?.map((entry) => {
                const prof = entry.profile
                const initials = prof?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
                const age = prof?.date_of_birth
                  ? Math.floor((Date.now() - new Date(prof.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                  : null

                return (
                  <Card key={entry.profile_id} className="glass-card hover:border-rose-500/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-14 w-14 border-2 border-rose-500/20">
                          <AvatarImage src={prof?.profile_photo_url} />
                          <AvatarFallback className="bg-rose-500/10 text-rose-400 font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{prof?.full_name}</h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {age && <Badge variant="outline" className="text-xs">{age} yrs</Badge>}
                            {prof?.gender && <Badge variant="outline" className="text-xs capitalize">{prof.gender}</Badge>}
                            {prof?.marital_status && <Badge variant="outline" className="text-xs capitalize">{prof.marital_status}</Badge>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {prof?.address && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{prof.address}</span>
                          </div>
                        )}
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
                        <p className="text-xs text-muted-foreground line-clamp-2 border-t border-white/5 pt-3">
                          {entry.about_me}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {filtered?.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <p className="text-muted-foreground">No profiles match your search.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
