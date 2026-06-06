"use client"

import * as React from "react"
import Link from "next/link"
import { useLanguageStore } from "@/store/language-store"
import { useTrans } from "@/lib/dictionary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Moon, Send, Sun, Twitter } from "lucide-react"
import { toast } from "sonner"

function Footerdemo() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const { language } = useLanguageStore()
  const t = useTrans(language)
  const [email, setEmail] = React.useState("")

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    toast.success(
      language === "vi"
        ? "Đăng ký nhận bản tin thành công!"
        : "Successfully subscribed to our newsletter!"
    )
    setEmail("")
  }

  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 text-left">
          {/* Brand & Newsletter */}
          <div className="relative">
            <h2 className="mb-4 text-3xl font-serif font-bold tracking-widest text-jotun-teal">
              Maison de FLOF
            </h2>
            <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
              {language === "vi"
                ? "Hệ thống phân phối sơn trực tuyến chính hãng hàng đầu Việt Nam. Đối tác phân phối chiến lược của Jotun, Dulux, Nippon Paint."
                : "Vietnam's leading genuine online paint distribution system. Strategic distribution partner of Jotun, Dulux, Nippon Paint."}
            </p>
            <form onSubmit={handleSubscribe} className="relative max-w-sm">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "vi" ? "Nhập email của bạn" : "Enter your email"}
                className="pr-12 backdrop-blur-sm border-warm-200 focus-visible:ring-jotun-teal/30 focus-visible:border-jotun-teal rounded-xl text-xs h-11"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1.5 top-1.5 h-8 w-8 rounded-xl bg-warm-900 text-white hover:bg-warm-850 transition-transform hover:scale-105"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-jotun-teal/5 blur-2xl" />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-base font-serif font-bold text-warm-900">
              {language === "vi" ? "Tính Năng Chính" : "Core Features"}
            </h3>
            <nav className="space-y-3 text-sm font-semibold text-warm-650">
              <Link href="/colors" className="block transition-colors hover:text-jotun-teal">
                {t.navColors}
              </Link>
              <Link href="/color-visualizer" className="block transition-colors hover:text-jotun-teal">
                {t.navVisualizer}
              </Link>
              <Link href="/find-dealer" className="block transition-colors hover:text-jotun-teal">
                {t.navDealers}
              </Link>
            </nav>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="mb-6 text-base font-serif font-bold text-warm-900">
              {language === "vi" ? "Danh Mục Sản Phẩm" : "Product Categories"}
            </h3>
            <nav className="space-y-3 text-sm font-semibold text-warm-650">
              <Link href="/products?category=son-noi-that" className="block transition-colors hover:text-jotun-teal">
                {language === "vi" ? "Sơn nội thất" : "Interior Paint"}
              </Link>
              <Link href="/products?category=son-ngoai-that" className="block transition-colors hover:text-jotun-teal">
                {language === "vi" ? "Sơn ngoại thất" : "Exterior Paint"}
              </Link>
              <Link href="/products?category=son-lot" className="block transition-colors hover:text-jotun-teal">
                {language === "vi" ? "Sơn lót kháng kiềm" : "Alkali Primer"}
              </Link>
              <Link href="/products?category=son-chong-tham" className="block transition-colors hover:text-jotun-teal">
                {language === "vi" ? "Sơn chống thấm" : "Waterproof Paint"}
              </Link>
            </nav>
          </div>

          {/* Contact & Socials */}
          <div className="relative">
            <h3 className="mb-6 text-base font-serif font-bold text-warm-900">
              {language === "vi" ? "Thông Tin Liên Hệ" : "Contact Us"}
            </h3>
            <address className="space-y-3 text-sm not-italic font-semibold text-warm-650 mb-6">
              <p className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-jotun-teal uppercase tracking-wider">Address:</span>
                <span className="leading-snug">
                  {language === "vi"
                    ? "Số 15 Cầu Giấy, Láng Thượng, Đống Đa, Hà Nội"
                    : "15 Cau Giay, Lang Thuong, Dong Da, Hanoi"}
                </span>
              </p>
              <p>Hotline: 1800 1511 / 0900 000 001</p>
              <p>Email: contact@flof.vn</p>
            </address>

            <div className="mb-6 flex space-x-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-warm-200 text-warm-650 hover:bg-warm-100 hover:text-warm-900 shadow-xs">
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === "vi" ? "Theo dõi chúng tôi trên Facebook" : "Follow us on Facebook"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-warm-200 text-warm-650 hover:bg-warm-100 hover:text-warm-900 shadow-xs">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === "vi" ? "Theo dõi chúng tôi trên Twitter" : "Follow us on Twitter"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-warm-200 text-warm-650 hover:bg-warm-100 hover:text-warm-900 shadow-xs">
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === "vi" ? "Theo dõi chúng tôi trên Instagram" : "Follow us on Instagram"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 border-warm-200 text-warm-650 hover:bg-warm-100 hover:text-warm-900 shadow-xs">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{language === "vi" ? "Kết nối trên LinkedIn" : "Connect on LinkedIn"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-warm-500" />
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="bg-warm-200"
              />
              <Moon className="h-4 w-4 text-warm-500" />
              <Label htmlFor="dark-mode" className="sr-only">
                Toggle dark mode
              </Label>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-warm-150 pt-8 text-center md:flex-row text-xs text-warm-450 font-semibold">
          <p>© {new Date().getFullYear()} FLOF. All rights reserved.</p>
          <nav className="flex gap-6">
            <a href="#" className="transition-colors hover:text-jotun-teal">
              {language === "vi" ? "Chính sách bảo mật" : "Privacy Policy"}
            </a>
            <a href="#" className="transition-colors hover:text-jotun-teal">
              {language === "vi" ? "Điều khoản dịch vụ" : "Terms of Service"}
            </a>
            <a href="#" className="transition-colors hover:text-jotun-teal">
              {language === "vi" ? "Thiết lập Cookie" : "Cookie Settings"}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
