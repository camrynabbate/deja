import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { cn } from '@/lib/utils';
import useIsMobile from '@/hooks/useIsMobile';

const BACKGROUNDS = [
  '#FAF9F7', '#F5F0E8', '#FAFAFA', '#F0EDE8',
  '#E8EFF5', '#F0EDE8', '#1A1A1A', '#2C2C2C',
  '#D4C5B0', '#C9D4CA', '#D4C5C5', '#C5C5D4',
];

const ColorSwatch = ({ color, selected, onClick }) => (
  <button
    onClick={() => onClick(color)}
    aria-label={`Select background colour ${color}`}
    className={cn(
      'w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 active:scale-95',
      selected ? 'border-accent shadow-md' : 'border-transparent'
    )}
    style={{ backgroundColor: color }}
  />
);

export default function BackgroundPicker({ value, onChange }) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const trigger = (
    <button
      aria-label="Change canvas background colour"
      onClick={isMobile ? () => setSheetOpen(true) : undefined}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary min-h-[44px]"
    >
      <div className="w-4 h-4 rounded-full border border-border shadow-sm" style={{ backgroundColor: value }} />
      <span className="hidden sm:inline">Background</span>
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Canvas Background">
          <div className="grid grid-cols-4 gap-3 px-5 py-4">
            {BACKGROUNDS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                selected={value === color}
                onClick={(c) => { onChange(c); setSheetOpen(false); }}
              />
            ))}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-44 p-3" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Canvas Colour</p>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUNDS.map((color) => (
            <ColorSwatch key={color} color={color} selected={value === color} onClick={onChange} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}