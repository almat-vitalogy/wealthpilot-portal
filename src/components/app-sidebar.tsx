"use client";

import * as React from "react";
import { Bot, Contact, GaugeCircle, Settings, HandCoins } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";

const data = {
  user: {
    name: "admin",
    email: "admin@gmail.com",
    avatar: "",
  },
  team: {
    name: "Wealth Pilot",
    logo: HandCoins,
    plan: "Enterprise",
  },
  navMain: [
    {
      title: "Clients",
      url: "/clients",
      icon: Contact,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: GaugeCircle,
      items: [
        {
          title: "Overview (Coming soon...)",
          url: "/dashboard/overview",
        },
        {
          title: "Client Overview",
          url: "/dashboard/client-overview",
        },
        {
          title: "Insights and Trends",
          url: "/dashboard/insights-trends",
        },
        {
          title: "Summary (Coming soon...)",
          url: "/dashboard/summary",
        },
      ],
    },
    {
      title: "AI Assistant",
      url: "/ai-assistant",
      icon: Bot,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher team={data.team} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
