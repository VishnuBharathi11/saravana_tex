import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function parseTime(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour: 10, minute: 0, period: "AM" as const };

  const hour24 = Number(match[1]);
  const minute = Number(match[2]);
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 || 12;

  return {
    hour: hour >= 1 && hour <= 12 ? hour : 10,
    minute: minute >= 0 && minute <= 59 ? minute : 0,
    period: period as "AM" | "PM",
  };
}

function to24Hour(hour: number, minute: number, period: "AM" | "PM") {
  const normalizedHour = hour % 12;
  const hour24 = period === "PM" ? normalizedHour + 12 : normalizedHour;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const time = parseTime(value);

  const update = (patch: Partial<typeof time>) => {
    onChange(
      to24Hour(
        patch.hour ?? time.hour,
        patch.minute ?? time.minute,
        patch.period ?? time.period,
      ),
    );
  };

  return (
    <div className={`grid grid-cols-[1fr_auto_auto] gap-2 ${className ?? ""}`}>
      <Select value={String(time.hour)} onValueChange={(value) => update({ hour: Number(value) })}>
        <SelectTrigger className="h-10 border-0 bg-white/70">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={String(hour)}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(time.minute)} onValueChange={(value) => update({ minute: Number(value) })}>
        <SelectTrigger className="h-10 min-w-[78px] border-0 bg-white/70">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {MINUTES.map((minute) => (
            <SelectItem key={minute} value={String(minute)}>
              {String(minute).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={time.period} onValueChange={(value) => update({ period: value as "AM" | "PM" })}>
        <SelectTrigger className="h-10 w-[82px] border-0 bg-white/70">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}