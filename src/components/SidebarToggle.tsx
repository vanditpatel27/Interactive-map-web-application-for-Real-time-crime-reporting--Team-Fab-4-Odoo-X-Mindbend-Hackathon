// components/SidebarToggle.tsx
import React from 'react';
import { Menu } from 'lucide-react';

interface SidebarToggleProps {
  className?: string;
}

export const SidebarToggle: React.FC<SidebarToggleProps> = ({ className }) => {
  return (
    <Menu className={className} size={24} />
  );
};