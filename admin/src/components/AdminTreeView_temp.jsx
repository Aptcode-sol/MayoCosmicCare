{/* Member Count Display - Only show if count > 0 */ }
{
    showStats ? (
        <div className="grid grid-cols-2 gap-2 text-xs">
            {(leftBV > 0 || rightBV > 0) && (
                <>
                    <div className="bg-indigo-50 rounded px-2 py-1 text-center">
                        <div className="text-indigo-600 font-bold">{leftBV}</div>
                        <div className="text-indigo-500 text-[10px]">L BV</div>
                    </div>
                    <div className="bg-pink-50 rounded px-2 py-1 text-center">
                        <div className="text-pink-600 font-bold">{rightBV}</div>
                        <div className="text-pink-500 text-[10px]">R BV</div>
                    </div>
                </>
            )}
            {(leftCount > 0 || rightCount > 0) && (
                <>
                    <div className="bg-indigo-50 rounded px-2 py-1 text-center">
                        <div className="text-indigo-600 font-bold">{leftCount}</div>
                        <div className="text-indigo-500 text-[10px]">Left</div>
                    </div>
                    <div className="bg-pink-50 rounded px-2 py-1 text-center">
                        <div className="text-pink-600 font-bold">{rightCount}</div>
                        <div className="text-pink-500 text-[10px]">Right</div>
                    </div>
                </>
            )}
        </div>
    ) : null
}
