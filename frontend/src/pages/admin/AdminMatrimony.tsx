import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { MatrimonyEntry } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MapPin, Briefcase, Calendar, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function AdminMatrimony() {
  const [search, setSearch] = useState("")

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-matrimony"],
    queryFn: async () => {
      const res = await api.get<MatrimonyEntry[]>("/admin/matrimony")
      return res.data
    },
  })

  const filtered = profiles?.filter((p) => {
    const fullName = p.profile?.full_name || ""
    const address = p.profile?.address || ""
    return (
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      address.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-6 w-6 text-rose-400" />
          <h1 className="text-2xl font-bold">Matrimony Profiles</h1>
        </div>
        <p className="text-muted-foreground">
          All community members who have opted in for matrimonial connections.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search profiles..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-6">{filtered?.length || 0} profiles</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered?.map((entry) => {
              const prof = entry.profile
              const initials = prof?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
              const age = prof?.date_of_birth
                ? Math.floor((Date.now() - new Date(prof.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                : null

              return (
                <Card key={entry.profile_id} className="glass-card hover:border-rose-500/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12 border-2 border-rose-500/20">
                        <AvatarImage src={prof?.profile_photo_url} />
                        <AvatarFallback className="bg-rose-500/10 text-rose-400 font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{prof?.full_name}</p>
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {age && <Badge variant="outline" className="text-xs">{age} yrs</Badge>}
                          {prof?.gender && <Badge variant="outline" className="text-xs capitalize">{prof.gender}</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground mb-3">
                      {prof?.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{prof.address}</span>
                        </div>
                      )}
                      {prof?.occupation && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{prof.occupation}</span>
                        </div>
                      )}
                      {prof?.date_of_birth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>{new Date(prof.date_of_birth).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {entry.about_me && (
                      <p className="text-xs text-muted-foreground border-t border-white/5 pt-3 line-clamp-2">
                        {entry.about_me}
                      </p>
                    )}
                    {entry.matrimony_details?.highest_qualification && (
                      <p className="text-xs text-muted-foreground mt-1">
                        🎓 {entry.matrimony_details.highest_qualification}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {filtered?.length === 0 && (
              <div className="col-span-full text-center py-16">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="text-muted-foreground">No matrimony profiles found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
