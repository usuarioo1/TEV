import React from 'react';

interface FormDetailItem {
    label: string;
    value: string;
    highlight?: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
    wide?: boolean;
}

interface TimelineEvent {
    timestamp: Date;
    title: string;
    description: string;
    user?: {
        name: string | null;
        username: string;
    };
    status?: string;
    image?: string | null;
    comment?: string | null;
    formDetails?: FormDetailItem[];
    type: 'creation' | 'assignment' | 'status_change' | 'verification' | 'closure';
}

interface AlertTimelineProps {
    events: TimelineEvent[];
}

const AlertTimeline: React.FC<AlertTimelineProps> = ({ events }) => {
    // Sort events by timestamp (oldest first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'creation':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                );
            case 'assignment':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                );
            case 'status_change':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                );
            case 'verification':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'closure':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return null;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'creation':
                return 'bg-blue-500';
            case 'assignment':
                return 'bg-purple-500';
            case 'status_change':
                return 'bg-yellow-500';
            case 'verification':
                return 'bg-indigo-500';
            case 'closure':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    if (sortedEvents.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500">
                No hay eventos registrados
            </div>
        );
    }

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {sortedEvents.map((event, eventIdx) => (
                    <li key={eventIdx}>
                        <div className="relative pb-8">
                            {eventIdx !== sortedEvents.length - 1 ? (
                                <span
                                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                                    aria-hidden="true"
                                />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                                {/* Icon */}
                                <div className="relative">
                                    <div
                                        className={`h-10 w-10 rounded-full ${getEventColor(event.type)} flex items-center justify-center ring-8 ring-white text-white`}
                                    >
                                        {getEventIcon(event.type)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div>
                                        <div className="text-sm">
                                            <span className="font-semibold text-gray-900">
                                                {event.title}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {new Date(event.timestamp).toLocaleString('es-CL', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700">
                                        <p>{event.description}</p>
                                        {event.user && (
                                            <p className="mt-1">
                                                <span className="font-medium">Por:</span>{' '}
                                                <span className="text-gray-900">
                                                    {event.user.name || event.user.username}
                                                </span>
                                            </p>
                                        )}
                                        {event.status && (
                                            <p className="mt-1">
                                                <span className="font-medium">Estado:</span>{' '}
                                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                                                    {event.status}
                                                </span>
                                            </p>
                                        )}
                                        {event.comment && (
                                            <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200">
                                                <p className="text-xs font-medium text-gray-600 mb-1">Comentario:</p>
                                                <p className="text-sm">{event.comment}</p>
                                            </div>
                                        )}
                                        {event.formDetails && event.formDetails.length > 0 && (
                                            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                                                    {event.formDetails.map((detail, i) => {
                                                        const highlightClass =
                                                            detail.highlight === 'red' ? 'text-red-600 font-semibold' :
                                                                detail.highlight === 'orange' ? 'text-orange-600 font-semibold' :
                                                                    detail.highlight === 'yellow' ? 'text-yellow-600 font-semibold' :
                                                                        detail.highlight === 'green' ? 'text-green-600 font-semibold' :
                                                                            detail.highlight === 'blue' ? 'text-blue-600 font-semibold' :
                                                                                'text-gray-900';
                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`bg-gray-50 px-3 py-2 ${detail.wide ? 'sm:col-span-2' : ''}`}
                                                            >
                                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{detail.label}</p>
                                                                <p className={`text-sm mt-0.5 whitespace-pre-wrap ${highlightClass}`}>{detail.value}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        {event.image && (
                                            <div className="mt-2">
                                                <p className="text-xs font-medium text-gray-600 mb-1">Evidencia:</p>
                                                <a
                                                    href={event.image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block"
                                                >
                                                    <img
                                                        src={event.image}
                                                        alt="Evidencia"
                                                        className="h-32 w-auto rounded border border-gray-300 hover:opacity-75 transition-opacity"
                                                    />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AlertTimeline;
