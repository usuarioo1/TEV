import type { ReactNode } from 'react';

interface GroupedSectionProps {
    title: string;
    count: number;
    icon: string;
    children: ReactNode;
}

export default function GroupedSection({ title, count, icon, children }: GroupedSectionProps) {
    return (
        <section className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50 flex items-center gap-2">
                <span>{icon}</span>
                <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
                <span className="ml-auto text-xs font-bold text-gray-500">{count}</span>
            </div>
            <div className="divide-y divide-gray-100">{children}</div>
        </section>
    );
}
