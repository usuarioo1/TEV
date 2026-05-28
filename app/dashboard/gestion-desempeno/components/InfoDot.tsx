interface InfoDotProps {
    tip: string;
}

export default function InfoDot({ tip }: InfoDotProps) {
    return (
        <span
            title={tip}
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-[10px] font-bold text-gray-600 cursor-help"
        >
            i
        </span>
    );
}
