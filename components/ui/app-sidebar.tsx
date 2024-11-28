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
import {BookText, NotebookTabs, PackageSearch, Layers, Ruler, Receipt} from 'lucide-react'

const inventoryLinks = [
  {
    title : 'Raw Materials', 
    url : '/materials',
    icon : Layers, 
  },
  {
    title : 'Products', 
    url : '/products',
    icon : PackageSearch, 
  },
  {
    title : 'Units', 
    url : '/units',
    icon : Ruler,
  },
]
const items = [
    {
      title : 'Customers', 
      url : '/customers', 
      icon : NotebookTabs
    },
    {
      title : 'Bill Of Materials', 
      url : '/bom', 
      icon : Receipt
    },
    { 
      title : 'Sales Orders', 
      url : '/sales-orders', 
      icon : BookText,
    }, 
]
export function AppSidebar() {
    return (
      <Sidebar>
        <SidebarHeader />
        <SidebarContent>
          <SidebarGroup />
            <SidebarGroupLabel>Inventory</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {inventoryLinks.map(item => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                            <a href={item.url} className="text-[16px]">
                                <item.icon />
                                <span>{item.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>))}
                </SidebarMenu>
            </SidebarGroupContent>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map(item => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                            <a href={item.url} className="text-[16px]">
                                <item.icon />
                                <span>{item.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>))}
                </SidebarMenu>
            </SidebarGroupContent>
          <SidebarGroup />
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>
    )
  }
  