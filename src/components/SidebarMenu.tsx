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
  // Dashboard
  { label: 'Dashboard', icon: <FaLayerGroup />, group: 'Dashboard', href: '/dashboard' },
  { label: 'Schools', icon: <FaLayerGroup />, group: 'Management', href: '/management/schools' },
  { label: 'Departments', icon: <FaUsers />, group: 'Management', href: '/management/departments' },
  { label: 'Staff', icon: <FaChalkboardTeacher />, group: 'Management', href: '/management/staff' },
  { label: 'Classes', icon: <FaUsers />, group: 'Management', href: '/management/classes' },
  { label: 'Sections', icon: <FaUsers />, group: 'Management', href: '/management/sections' },
  { label: 'Subjects', icon: <FaBook />, group: 'Management', href: '/management/subjects' },
  { label: 'Curriculums', icon: <FaUsers />, group: 'Management', href: '/management/curriculums' },
  { label: 'Academic Years', icon: <FaUsers />, group: 'Management', href: '/management/academicyears' },
  { label: 'Terms', icon: <FaUsers />, group: 'Management', href: '/management/terms' },
  { label: 'Admission', icon: <FaUsers />, group: 'Student', href: '/student/studentapplication' },
  { label: 'Student Guardians', icon: <FaUsers />, group: 'Student', href: '/student/guardians' },
  { label: 'Student Registrations', icon: <FaUsers />, group: 'Student', href: '/student/registrations' },
  { label: 'Student Curriculums', icon: <FaUsers />, group: 'Student', href: '/student/studentcurriculums' },
  { label: 'Student Detail', icon: <FaUsers />, group: 'Student', href: '/student/studentdetail' },
  // Student Academics
  { label: 'Assessment Types', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/assessmenttypes' },
  { label: 'Grading Schemes', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/gradingschemes' },
  { label: 'Assessments', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/assessments' },
  { label: 'Exam Papers', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/exampapers' },
  { label: 'Attendance', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/attendance' },
  { label: 'Assignments', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/assignments' },
  { label: 'Assignment Submissions', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/assignmentsubmissions' },
  { label: 'Assessment Results', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/assessmentresults' },
  { label: 'Report Cards', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/reportcards' },
  { label: 'Report Card Details', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/reportcarddetails' },
  { label: 'Promotion Records', icon: <FaBook />, group: 'Student Academics', href: '/studentacademics/promotionrecords' },
  // Finance
  { label: 'Fee Items', icon: <FaBook />, group: 'Finance', href: '/finance/feeitems' },
  { label: 'Fee Structures', icon: <FaBook />, group: 'Finance', href: '/finance/feestructures' },
  { label: 'Invoices', icon: <FaBook />, group: 'Finance', href: '/finance/invoices' },
  { label: 'Payments', icon: <FaBook />, group: 'Finance', href: '/finance/payments' },
  { label: 'Scholarships', icon: <FaBook />, group: 'Finance', href: '/finance/scholarships' },
  { label: 'Fines', icon: <FaBook />, group: 'Finance', href: '/finance/fines' },
  { label: 'Expenses', icon: <FaBook />, group: 'Finance', href: '/finance/expenses' },
  { label: 'Budgets', icon: <FaBook />, group: 'Finance', href: '/finance/budgets' },
  { label: 'Financial Reports', icon: <FaBook />, group: 'Finance', href: '/finance/financialreports' },
  { label: 'Account Types', icon: <FaBook />, group: 'Finance', href: '/finance/accounttypes' },
  { label: 'Chart of Accounts', icon: <FaBook />, group: 'Finance', href: '/finance/chartofaccounts' },
  { label: 'Journal Entries', icon: <FaBook />, group: 'Finance', href: '/finance/journalentries' },
  { label: 'Ledgers', icon: <FaBook />, group: 'Finance', href: '/finance/ledgers' },
  { label: 'User Accounts', icon: <FaUser />, group: 'Users', href: '/useraccount' },
  { label: 'Settings', icon: <FaCog />, group: 'System', href: '/settings' },
];

const groupIcons: Record<string, React.ReactNode> = {
  Management: <FaLayerGroup className="mr-2" />,
  Student: <FaLayerGroup className="mr-2" />,
  'Student Academics': <FaLayerGroup className="mr-2" />,
  Finance: <FaLayerGroup className="mr-2" />,
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
