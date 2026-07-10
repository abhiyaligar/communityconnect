import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"
import api from "@/lib/api"
import { Globe, ArrowRight } from "lucide-react"

export type SupportedLanguage = "en" | "kn" | "hi" | "es" | "mr"

const translations = {
  en: {
    welcome: "Welcome Back",
    dashboard: "Dashboard",
    registry: "Registry",
    requests: "Connection Requests",
    settings: "Settings",
    logout: "Log Out",
    express_interest: "Express Interest",
    requested: "Requested",
    connected: "Connected",
    declined: "Declined",
    inbox: "Inbox",
    sent: "Sent",
    awaiting: "Awaiting",
    guardian_view: "Guardian View",
    gender: "Gender",
    marital_status: "Marital Status",
    age: "Age",
    search_placeholder: "Search community members...",
    login: "Log In",
    register: "Register",
    email_label: "Email Address",
    password_label: "Password",
    forgot_password: "Forgot?",
    cancel_request: "Cancel Request",
    decline: "Decline",
    approve_interest: "Approve Interest",
    select_language: "Select Your Language",
    select_language_subtitle: "Choose your preferred language for the interface.",
  },
  kn: {
    welcome: "ಸ್ವಾಗತ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    registry: "ನೋಂದಣಿ ಪುಸ್ತಕ",
    requests: "ಸಂಪರ್ಕ ವಿನಂತಿಗಳು",
    settings: "ಸಂಯೋಜನೆಗಳು",
    logout: "ಲಾಗ್ ಔಟ್",
    express_interest: "ಆಸಕ್ತಿ ವ್ಯಕ್ತಪಡಿಸಿ",
    requested: "ವಿನಂತಿಸಲಾಗಿದೆ",
    connected: "ಸಂಪರ್ಕಿಸಲಾಗಿದೆ",
    declined: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    inbox: "ಇನ್‌ಬಾಕ್ಸ್",
    sent: "ಕಳುಹಿಸಲಾಗಿದೆ",
    awaiting: "ಕಾಯಲಾಗುತ್ತಿದೆ",
    guardian_view: "ಪೋಷಕರ ನೋಟ",
    gender: "ಲಿಂಗ",
    marital_status: "ವೈವಾಹಿಕ ಸ್ಥಿತಿ",
    age: "ವಯಸ್ಸು",
    search_placeholder: "ಸಮುದಾಯದ ಸದಸ್ಯರನ್ನು ಹುಡುಕಿ...",
    login: "ಲಾಗ್ ಇನ್",
    register: "ನೋಂದಣಿ",
    email_label: "ಇಮೇಲ್ ವಿಳಾಸ",
    password_label: "ಪಾಸ್ವರ್ಡ್",
    forgot_password: "ಮರೆತಿರಾ?",
    cancel_request: "ವಿನಂತಿಯನ್ನು ರದ್ದುಮಾಡಿ",
    decline: "ತಿರಸ್ಕರಿಸಿ",
    approve_interest: "ಆಸಕ್ತಿಯನ್ನು ಅನುಮೋದಿಸಿ",
    select_language: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    select_language_subtitle: "ವೆಬ್ ಅಪ್ಲಿಕೇಶನ್‌ಗಾಗಿ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆರಿಸಿ.",
  },
  hi: {
    welcome: "स्वागत है",
    dashboard: "डैशबोर्ड",
    registry: "रजिस्ट्री",
    requests: "संपर्क अनुरोध",
    settings: "सेटिंग्स",
    logout: "लॉग आउट",
    express_interest: "रुचि व्यक्त करें",
    requested: "अनुरोधित",
    connected: "जुड़े हुए",
    declined: "अस्वीकृत",
    inbox: "इनबॉक्स",
    sent: "भेजा गया",
    awaiting: "प्रतीक्षारत",
    guardian_view: "अभिभावक दृश्य",
    gender: "लिंग",
    marital_status: "वैवाहिक स्थिति",
    age: "उम्र",
    search_placeholder: "सामुदायिक सदस्यों को खोजें...",
    login: "लॉग इन",
    register: "पंजीकरण",
    email_label: "ईमेल पता",
    password_label: "पासवर्ड",
    forgot_password: "भूल गए?",
    cancel_request: "अनुरोध रद्द करें",
    decline: "अस्वीकार करें",
    approve_interest: "रुचि स्वीकृत करें",
    select_language: "अपनी भाषा चुनें",
    select_language_subtitle: "वेब एप्लिकेशन के लिए अपनी पसंदीदा भाषा चुनें।",
  },
  es: {
    welcome: "Bienvenido",
    dashboard: "Tablero",
    registry: "Registro",
    requests: "Solicitudes",
    settings: "Ajustes",
    logout: "Cerrar sesión",
    express_interest: "Expresar interés",
    requested: "Solicitado",
    connected: "Conectado",
    declined: "Rechazado",
    inbox: "Bandeja de entrada",
    sent: "Enviado",
    awaiting: "Esperando",
    guardian_view: "Vista del tutor",
    gender: "Género",
    marital_status: "Estado civil",
    age: "Edad",
    search_placeholder: "Buscar miembros...",
    login: "Iniciar sesión",
    register: "Registrarse",
    email_label: "Correo electrónico",
    password_label: "Contraseña",
    forgot_password: "¿Olvidó?",
    cancel_request: "Cancelar solicitud",
    decline: "Declinar",
    approve_interest: "Aprobar interés",
    select_language: "Selecciona tu idioma",
    select_language_subtitle: "Elija su idioma preferido para la interfaz.",
  },
  mr: {
    welcome: "सुस्वागतम",
    dashboard: "डॅशबोर्ड",
    registry: "नोंदणी",
    requests: "संपर्क विनंत्या",
    settings: "सेटिंग्ज",
    logout: "लॉग आउट",
    express_interest: "रस दाखवा",
    requested: "विनंती केली",
    connected: "कनेक्टेड",
    declined: "नाकारले",
    inbox: "इनबॉक्स",
    sent: "पाठवले",
    awaiting: "प्रतीक्षेत",
    guardian_view: "पालक दृश्य",
    gender: "लिंग",
    marital_status: "वैवाहिक स्थिती",
    age: "वय",
    search_placeholder: "सदास्य शोधा...",
    login: "लॉग इन करा",
    register: "नोंदणी करा",
    email_label: "ईमेल पत्ता",
    password_label: "पासवर्ड",
    forgot_password: "विसरलात?",
    cancel_request: "विनंती रद्द करा",
    decline: "नाकारा",
    approve_interest: "मंजूर करा",
    select_language: "तुमची भाषा निवडा",
    select_language_subtitle: "वेब ॲप्लिकेशनसाठी तुमची पसंतीची भाषा निवडा.",
  },
}

interface LanguageContextType {
  language: SupportedLanguage
  changeLanguage: (lang: SupportedLanguage) => Promise<void>
  t: (key: keyof typeof translations["en"]) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem("preferred_language") as SupportedLanguage) || "en"
  })
  const [showSelector, setShowSelector] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("preferred_language")
    if (!saved) {
      setShowSelector(true)
    }
  }, [])

  const changeLanguage = async (lang: SupportedLanguage) => {
    setLanguage(lang)
    localStorage.setItem("preferred_language", lang)
    setShowSelector(false)

    // If authenticated, sync with backend
    const token = localStorage.getItem("access_token")
    if (token) {
      try {
        await api.put("/profiles/preferred-language", { preferred_language: lang })
      } catch (err) {
        console.error("Failed to sync preferred language with server:", err)
      }
    }
  }

  const t = (key: keyof typeof translations["en"]): string => {
    const dict = translations[language] || translations["en"]
    return dict[key] || translations["en"][key] || String(key)
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
      {showSelector && (
        <div className="fixed inset-0 z-[9999] bg-[#090d16]/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in text-white">
          <div className="max-w-xl w-full bg-[#111827]/80 border border-white/10 rounded-[28px] p-6 md:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="p-4 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/25 animate-pulse">
              <Globe className="h-10 w-10" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                Select Your Language / ಭಾಷೆಯನ್ನು ಆರಿಸಿ / भाषा चुनें
              </h2>
              <p className="text-xs text-slate-400">
                Choose your preferred interface language. You can change this later in settings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
              <button
                onClick={() => changeLanguage("en")}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl cursor-pointer text-left transition-all hover:scale-[1.02]"
              >
                <div>
                  <p className="text-sm font-bold">English</p>
                  <p className="text-[10px] text-slate-400">English (US)</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => changeLanguage("kn")}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl cursor-pointer text-left transition-all hover:scale-[1.02]"
              >
                <div>
                  <p className="text-sm font-bold">ಕನ್ನಡ</p>
                  <p className="text-[10px] text-slate-400">Kannada</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => changeLanguage("hi")}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl cursor-pointer text-left transition-all hover:scale-[1.02]"
              >
                <div>
                  <p className="text-sm font-bold">हिन्दी</p>
                  <p className="text-[10px] text-slate-400">Hindi</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => changeLanguage("mr")}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-2xl cursor-pointer text-left transition-all hover:scale-[1.02]"
              >
                <div>
                  <p className="text-sm font-bold">मराठी</p>
                  <p className="text-[10px] text-slate-400">Marathi</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}
