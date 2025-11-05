import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Room {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment?: string;
  description?: string;
  isAvailable?: boolean;
}

interface ReservationFiltersProps {
  rooms: Room[];
  selectedRooms: string[];
  onRoomFilter: (roomIds: string[]) => void;
  onClearFilters: () => void;
}

export function ReservationFilters({
  rooms,
  selectedRooms,
  onRoomFilter,
  onClearFilters,
}: ReservationFiltersProps) {
  const handleRoomSelect = (roomId: string) => {
    const newSelectedRooms = selectedRooms.includes(roomId)
      ? selectedRooms.filter((id) => id !== roomId)
      : [...selectedRooms, roomId];
    onRoomFilter(newSelectedRooms);
  };

  const removeRoomFilter = (roomId: string) => {
    onRoomFilter(selectedRooms.filter((id) => id !== roomId));
  };

  const hasActiveFilters = selectedRooms.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            필터
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-1" />
              전체 해제
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 회의실 필터 */}
        <div>
          <h4 className="text-sm font-medium mb-3">회의실</h4>
          <Select onValueChange={handleRoomSelect}>
            <SelectTrigger>
              <SelectValue placeholder="회의실 선택" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => (
                <SelectItem
                  key={room.roomId}
                  value={room.roomId.toString()}
                  disabled={selectedRooms.includes(room.roomId.toString())}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{room.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {room.location} · {room.capacity}명
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedRooms.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedRooms.map((roomId) => {
                const room = rooms.find((r) => r.roomId.toString() === roomId);
                return (
                  <Badge
                    key={roomId}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => removeRoomFilter(roomId)}
                  >
                    {room?.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* 필터 요약 */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              {selectedRooms.length}개 회의실 필터 적용 중
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
