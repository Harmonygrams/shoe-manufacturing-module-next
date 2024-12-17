'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BookText, NotebookTabs, PackageSearch, Layers, Ruler, Receipt, PencilRuler, Brush, CircleUser, ShoppingBag } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const inventoryLinks = [
  {
    title: 'Units',
    url: '/units',
    icon: Ruler,
  },
  {
    title: 'Sizes',
    url: '/sizes',
    icon: PencilRuler,
  },
  {
    title: 'Colors',
    url: '/colors',
    icon: Brush
  },
  {
    title: 'Raw Materials',
    url: '/materials',
    icon: Layers,
  },
  {
    title: 'Products',
    url: '/products',
    icon: PackageSearch,
  },
]


const contacts = [
  {
    title: 'Customers',
    url: '/customers',
    icon: NotebookTabs
  },
  {
    title : "Suppliers", 
    url : "/suppliers", 
    icon : CircleUser,
  },
]

const transactions = [
  {
    title: 'Bill Of Materials',
    url: '/bom',
    icon: Receipt
  },
  {
    title  : 'Purchases', 
    url : '/purchases',
    icon : ShoppingBag,
  }, 
  {
    title: 'Sales Orders',
    url: '/sales',
    icon: BookText,
  },
  {
    title: 'Production',
    url: '/production',
    icon: NotebookTabs
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  // Helper function to check if a route is active
  const isRouteActive = (url: string) => {
    // Exact match for root paths like /products, /sales etc
    if (url === '/' && pathname === '/') return true
    
    // For all other paths, check if the current pathname starts with the URL
    // This ensures /production will be active when viewing /production/new
    return pathname.startsWith(url)
  }

  return (
    <Sidebar className="bg-sidebar-background text-sidebar-foreground">
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Inventory</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {inventoryLinks.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`text-[16px] rounded-md transition-colors ${
                        isRouteActive(item.url)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <item.icon className={isRouteActive(item.url) ? 'text-sidebar-primary-foreground' : ''} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Contacts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {contacts.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`text-[16px] rounded-md transition-colors ${
                        isRouteActive(item.url)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <item.icon className={isRouteActive(item.url) ? 'text-sidebar-primary-foreground' : ''} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">Transactions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {transactions.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={`text-[16px] rounded-md transition-colors ${
                        isRouteActive(item.url)
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <item.icon className={isRouteActive(item.url) ? 'text-sidebar-primary-foreground' : ''} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}