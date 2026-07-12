import { useAuth } from "@/contexts/AuthContext"

interface ProtectedImageProps {
  src?: string
  alt?: string
  className?: string
  wrapperClassName?: string
}

export function ProtectedImage({ src, alt = "", className = "", wrapperClassName = "" }: ProtectedImageProps) {
  const { user } = useAuth()

  const viewerName = user?.full_name || "Guest"
  const viewerUsername = user?.username ? `@${user.username}` : ""
  const dateStr = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
  const watermarkText = `${viewerName} ${viewerUsername} • ${dateStr}`

  return (
    <div
      className={`relative overflow-hidden select-none ${wrapperClassName}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`pointer-events-none ${className}`}
      />
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          background: `repeating-linear-gradient(
            -45deg,
            transparent 0px,
            transparent 60px,
            rgba(0,0,0,0.03) 60px,
            rgba(0,0,0,0.03) 61px
          )`,
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none select-none bg-gradient-to-t from-black/40 to-transparent px-2.5 pb-1.5 pt-6">
        <p className="text-[9px] text-white/70 font-medium tracking-wide leading-tight truncate">
          {watermarkText}
        </p>
      </div>
    </div>
  )
}
