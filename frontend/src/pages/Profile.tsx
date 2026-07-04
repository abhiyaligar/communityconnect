import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AuthUser } from "@/types"
import api from "@/lib/api"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User, Phone, MapPin, Briefcase, Calendar,
  Users, ShieldCheck, Clock,
  Link as LinkIcon, Edit, Loader2
} from "lucide-react"

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>


function SocialLinksEditor({ user, onSuccess }: { user: AuthUser, onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState({
    linkedin: user.social_links?.linkedin || "",
    instagram: user.social_links?.instagram || "",
    facebook: user.social_links?.facebook || "",
    twitter: user.social_links?.twitter || "",
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put("/profiles/me/social", { social_links: links })
      toast.success("Social links updated")
      onSuccess()
      setOpen(false)
    } catch (err) {
      toast.error("Failed to update social links")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
          <Edit className="h-3 w-3" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Social Links</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="linkedin" className="flex items-center gap-2"><LinkedinIcon className="h-4 w-4"/> LinkedIn URL</Label>
            <Input id="linkedin" value={links.linkedin} onChange={e => setLinks({...links, linkedin: e.target.value})} placeholder="https://linkedin.com/in/username" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="instagram" className="flex items-center gap-2"><InstagramIcon className="h-4 w-4"/> Instagram URL</Label>
            <Input id="instagram" value={links.instagram} onChange={e => setLinks({...links, instagram: e.target.value})} placeholder="https://instagram.com/username" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facebook" className="flex items-center gap-2"><FacebookIcon className="h-4 w-4"/> Facebook URL</Label>
            <Input id="facebook" value={links.facebook} onChange={e => setLinks({...links, facebook: e.target.value})} placeholder="https://facebook.com/username" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="twitter" className="flex items-center gap-2"><TwitterIcon className="h-4 w-4"/> X (Twitter) URL</Label>
            <Input id="twitter" value={links.twitter} onChange={e => setLinks({...links, twitter: e.target.value})} placeholder="https://x.com/username" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Profile() {
  const { user, refreshUser } = useAuth()

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  const age = user?.date_of_birth
    ? Math.floor((Date.now() - new Date(user.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <div className="min-h-screen bg-background pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative border border-border rounded-2xl overflow-hidden bg-card">
          {/* Banner */}
          <div className="h-24 bg-secondary/50" />

          <div className="px-6 pb-6">
            <div className="flex items-end gap-5 -mt-8 mb-6">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarImage src={user?.profile_photo_url} />
                <AvatarFallback className="text-xl font-bold bg-muted text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1">
                <h1 className="text-xl font-bold tracking-tight">{user?.full_name}</h1>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant={user?.role === "verified_adult" ? "default" : "secondary"} className="text-[10px]">
                    {user?.role === "verified_adult" && <ShieldCheck className="h-3 w-3 mr-1" />}
                    {user?.role === "unverified" && <Clock className="h-3 w-3 mr-1" />}
                    <span className="capitalize">{user?.role?.replace(/_/g, " ")}</span>
                  </Badge>
                  {user?.gender && (
                    <Badge variant="outline" className="capitalize text-[10px] font-normal">{user.gender}</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Phone, label: "Phone Number", value: user?.contact_number },
                { icon: Calendar, label: "Date of Birth", value: user?.date_of_birth ? `${new Date(user.date_of_birth).toLocaleDateString()} (${age} yrs)` : "—" },
                { icon: MapPin, label: "Address", value: user?.address || "Not provided" },
                { icon: Briefcase, label: "Occupation", value: user?.occupation || "Not provided" },
                { icon: Users, label: "Marital Status", value: user?.marital_status ? user.marital_status.charAt(0).toUpperCase() + user.marital_status.slice(1) : "—" },
                { icon: User, label: "Gender", value: user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 p-3.5 rounded-xl bg-secondary/35 border border-border">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0 border border-border">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <Card className="border border-border shadow-none bg-card">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-foreground" /> Social Links
            </CardTitle>
            {user && <SocialLinksEditor user={user} onSuccess={refreshUser} />}
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <LinkedinIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">LinkedIn</p>
                  {user?.social_links?.linkedin ? (
                    <a href={user.social_links.linkedin} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {user.social_links.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <InstagramIcon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Instagram</p>
                  {user?.social_links?.instagram ? (
                    <a href={user.social_links.instagram} target="_blank" rel="noreferrer" className="text-sm text-pink-600 hover:underline truncate block">
                      {user.social_links.instagram.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
                  <FacebookIcon className="h-4 w-4 text-blue-700 dark:text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Facebook</p>
                  {user?.social_links?.facebook ? (
                    <a href={user.social_links.facebook} target="_blank" rel="noreferrer" className="text-sm text-blue-700 hover:underline truncate block">
                      {user.social_links.facebook.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
                  <TwitterIcon className="h-4 w-4 text-slate-800 dark:text-slate-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">X (Twitter)</p>
                  {user?.social_links?.twitter ? (
                    <a href={user.social_links.twitter} target="_blank" rel="noreferrer" className="text-sm text-foreground hover:underline truncate block">
                      {user.social_links.twitter.replace(/^https?:\/\/(www\.)?/, '')}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border border-border shadow-none bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-foreground" /> Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-muted-foreground">Member ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded border border-border font-mono">
                  {user ? "CC-" + user.contact_number?.slice(-4) : "—"}
                </code>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-muted-foreground">Account Role</span>
                <Badge variant={user?.role === "verified_adult" ? "default" : "secondary"} className="text-[10px] font-semibold capitalize">
                  {user?.role?.replace(/_/g, " ")}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-muted-foreground">Verification</span>
                <span className="text-xs font-semibold">
                  {user?.role === "unverified" ? (
                    <span className="text-amber-500">Pending review</span>
                  ) : (
                    <span className="text-emerald-600">Verified ✓</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
