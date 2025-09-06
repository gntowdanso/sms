"use client";
import React, { useState } from 'react';
import { FaUser, FaUsers, FaChalkboardTeacher, FaBook, FaCog, FaLayerGroup, FaTools, FaChevronDown, FaChevronRight } from 'react-icons/fa';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  group: string;
  href?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Schools', icon: <FaLayerGroup />, group: 'Management', href: '/management/schools' },
  { label: 'Departments', icon: <FaUsers />, group: 'Management', href: '/management/departments' },
  { label: 'Staff', icon: <FaChalkboardTeacher />, group: 'Management', href: '/management/staff' },
  { label: 'Classes', icon: <FaUsers />, group: 'Management', href: '/management/classes' },
  { label: 'Sections', icon: <FaUsers />, group: 'Management', href: '/management/sections' },
  { label: 'Subjects', icon: <FaBook />, group: 'Management', href: '/management/subjects' },
  { label: 'Curriculums', icon: <FaUsers />, group: 'Management', href: '/management/curriculums' },
  { label: 'Academic Years', icon: <FaUsers />, group: 'Management', href: '/management/academicyears' },
  { label: 'Terms', icon: <FaUsers />, group: 'Management', href: '/management/terms' },
  { label: 'User Accounts', icon: <FaUser />, group: 'Users', href: '/useraccount' },
  { label: 'Settings', icon: <FaCog />, group: 'System', href: '/settings' },
];

const groupIcons: Record<string, React.ReactNode> = {
  Management: <FaLayerGroup className="mr-2" />,
  Users: <FaUser className="mr-2" />,
  System: <FaTools className="mr-2" />,
};

const groupedItems = menuItems.reduce((acc, item) => {
  acc[item.group] = acc[item.group] || [];
  acc[item.group].push(item);
  return acc;
}, {} as Record<string, MenuItem[]>);

const SidebarMenu: React.FC = () => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Management: false });

  const toggleGroup = (group: string) => setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));

  return (
    <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col p-4">
      <h1 className="text-xl font-bold mb-6">School SMS</h1>
      {Object.entries(groupedItems).map(([group, items]) => (
        <div key={group} className="mb-6">
          <div className="flex items-center justify-between text-gray-400 uppercase text-xs mb-2 cursor-pointer" onClick={() => toggleGroup(group)}>
            <div className="flex items-center">
              {groupIcons[group]}
              <span>{group}</span>
            </div>
            <div className="mr-2">{collapsed[group] ? <FaChevronRight /> : <FaChevronDown />}</div>
          </div>
          {!collapsed[group] && (
            <ul>
              {items.map(item => {
                const href = item.href || '#';
                return (
                  <li key={item.label} className="flex items-center gap-3 py-2 px-6 rounded hover:bg-gray-700 cursor-pointer" onClick={() => { if (href !== '#') window.location.href = href; }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
};

export default SidebarMenu;
