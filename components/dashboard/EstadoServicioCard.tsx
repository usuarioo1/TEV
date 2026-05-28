interface EstadoServicioCardProps {
    estado: {
        key: string;
        label: string;
        color: string;
        icon: string;
    };
    count: number;
}

export default function EstadoServicioCard({ estado, count }: EstadoServicioCardProps) {
    const getTextColor = () => {
        if (estado.color.includes('gray')) return 'text-gray-900';
        if (estado.color.includes('blue')) return 'text-blue-600';
        if (estado.color.includes('green')) return 'text-green-600';
        if (estado.color.includes('yellow')) return 'text-yellow-600';
        if (estado.color.includes('purple')) return 'text-purple-600';
        if (estado.color.includes('teal')) return 'text-teal-600';
        return 'text-orange-600';
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{estado.icon}</span>
                <span className={`text-2xl font-bold ${getTextColor()}`}>
                    {count}
                </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">{estado.label}</p>
        </div>
    );
}
