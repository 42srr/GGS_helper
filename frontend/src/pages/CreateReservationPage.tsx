import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, User, ArrowLeft, ChevronDown, RotateCcw } from 'lucide-react';

interface Room {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment?: string;
  description?: string;
  isAvailable: boolean;
}

export function CreateReservationPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(true);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banInfo, setBanInfo] = useState<{ banUntil: string | null }>({ banUntil: null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    roomId: '',
    teamName: '',
    attendees: ''
  });

  useEffect(() => {
    checkReservationStatus();
    fetchRooms();
  }, []);

  const checkReservationStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/users/reservation-status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.isBanned) {
          setBanInfo({ banUntil: data.banUntil });
          setShowBanDialog(true);
        }
      }
    } catch (error) {
      console.error('Failed to check reservation status:', error);
    }
  };

  useEffect(() => {
    // URL 파라미터에서 roomId 확인 및 방 자동 선택
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId');
    if (roomId && rooms.length > 0) {
      setFormData(prev => ({ ...prev, roomId }));
      handleRoomSelect(roomId);
    }
  }, [rooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/rooms', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRooms(data.filter((room: Room) => room.isAvailable));
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.roomId.toString() === roomId);
    setSelectedRoom(room || null);
    setFormData(prev => ({ ...prev, roomId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 한국 시간(KST)을 UTC ISO 문자열로 변환
      // 예: "2025-10-27T15:30" (KST) -> "2025-10-27T06:30:00.000Z" (UTC)
      const reservationData = {
        title: formData.title,
        description: formData.description || undefined,
        roomId: parseInt(formData.roomId),
        startTime: `${formData.date}T${formData.startTime}:00+09:00`, // KST 명시
        endTime: `${formData.date}T${formData.endTime}:00+09:00`,       // KST 명시
        teamName: formData.teamName || undefined,
        attendees: formData.attendees ? parseInt(formData.attendees) : undefined
      };

      console.log('Sending reservation data:', reservationData);

      const response = await fetch('http://localhost:3001/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(reservationData),
      });

      if (response.ok) {
        alert('예약이 성공적으로 생성되었습니다!');
        navigate('/my-reservations');
      } else {
        const error = await response.json();
        console.error('Server error response:', error);
        alert(`예약 생성 실패: ${error.message || JSON.stringify(error.errors || error)}`);
      }
    } catch (error) {
      console.error('Reservation creation error:', error);
      alert('예약 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetTimeSelection = () => {
    setFormData(prev => ({ ...prev, startTime: '', endTime: '' }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      // 로컬 시간대 기준으로 날짜 포맷 (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFormData(prev => ({ ...prev, date: formattedDate }));
      setDatePickerOpen(false);
    }
  };

  // 시간 옵션 생성 (09:00 ~ 21:00, 30분 단위)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 21 && minute === 30) break; // 21:30 제외
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  // 시작 시간 옵션 생성 (종료 시간 기준 최대 2시간 전까지)
  const generateStartTimeOptions = () => {
    if (!formData.endTime) {
      return generateTimeOptions();
    }

    const allOptions = generateTimeOptions();
    const endIndex = allOptions.indexOf(formData.endTime);

    if (endIndex === -1) {
      return allOptions;
    }

    // 종료 시간으로부터 2시간 전까지의 옵션만 필터링 (30분 단위이므로 4칸)
    return allOptions.filter((_time, index) => {
      return index < endIndex && index >= endIndex - 4;
    });
  };

  // 종료 시간 옵션 생성 (시작 시간 기준 최대 2시간 후까지)
  const generateEndTimeOptions = () => {
    if (!formData.startTime) {
      return generateTimeOptions();
    }

    const allOptions = generateTimeOptions();
    const startIndex = allOptions.indexOf(formData.startTime);

    if (startIndex === -1) {
      return allOptions;
    }

    // 시작 시간으로부터 2시간 후까지의 옵션만 필터링 (30분 단위이므로 4칸)
    return allOptions.filter((_time, index) => {
      return index > startIndex && index <= startIndex + 4;
    });
  };

  const startTimeOptions = generateStartTimeOptions();
  const endTimeOptions = generateEndTimeOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 예약 금지 다이얼로그 */}
      <Dialog open={showBanDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">예약 제한 안내</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-gray-900 font-medium mb-2">
                예약이 제한되었습니다.
              </p>
              {banInfo.banUntil ? (
                <p className="text-gray-700">
                  <span className="font-semibold">해제일:</span>{' '}
                  {new Date(banInfo.banUntil).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              ) : (
                <p className="text-red-700 font-semibold">
                  노쇼 3회 누적으로 영구 예약 금지되었습니다.
                  <br />
                  관리자와의 면담 후 해제 가능합니다.
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {banInfo.banUntil
                ? '노쇼 또는 지각 3회 누적으로 7일간 예약이 제한됩니다. 해제일 이후에 다시 예약하실 수 있습니다.'
                : '노쇼 3회 누적으로 예약이 영구 제한되었습니다. 관리자에게 문의하여 면담을 진행해주세요.'}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => navigate('/reservations')} className="w-full">
              예약 목록으로 돌아가기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이용 수칙 다이얼로그 */}
      <Dialog open={showRulesDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">이용자 의무수칙</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-bold text-lg mb-2">청결 유지</h3>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                <li>퇴실 전 자리 정돈 및 쓰레기 처리 필수</li>
                <li>퇴실 시간 5분 전 정리 완료</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">음식물 반입</h3>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                <li>음식물 반입 제한 (필요 시 지정 구역에서만 가능)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">타인 배려</h3>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                <li>소음 자제, 다른 이용자에게 방해 금지</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">본인 확인</h3>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                <li>예약자 본인 입실 원칙</li>
                <li>타인 대리 사용 금지</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">필수 확인 사항</h3>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                <li>입실 시: 좌석 상태 사진 촬영</li>
                <li>퇴실 시: 정리 완료 후 좌석 상태 사진 촬영</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">시간 관련 안내</h3>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                <li>지각: 예약 시간 10분 경과</li>
                <li>노쇼: 예약 시간 30분 경과 (자동 취소)</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRulesDialog(false)} className="w-full">
              동의하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              새 예약 만들기
            </h1>
            <p className="text-gray-600">
              회의실을 예약하고 팀 미팅을 계획하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  예약 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">예약 제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="예: 프로젝트 킥오프 미팅"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="회의 목적이나 준비사항을 간단히 적어주세요"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="teamName">팀명</Label>
                  <Input
                    id="teamName"
                    value={formData.teamName}
                    onChange={(e) => handleInputChange('teamName', e.target.value)}
                    placeholder="예: 개발팀, 디자인팀"
                  />
                </div>
                <div>
                  <Label htmlFor="attendees">예약 인원 *</Label>
                  <Input
                    id="attendees"
                    type="number"
                    min="4"
                    max="12"
                    value={formData.attendees}
                    onChange={(e) => handleInputChange('attendees', e.target.value)}
                    placeholder="4명 이상 12명 이하"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">최소 4명, 최대 12명까지 예약 가능합니다.</p>
                </div>
              </CardContent>
            </Card>

            {/* 회의실 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  회의실 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>회의실 *</Label>
                  <Select onValueChange={handleRoomSelect} required>
                    <SelectTrigger>
                      <SelectValue placeholder="회의실을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>
                          회의실 정보를 불러오는 중...
                        </SelectItem>
                      ) : rooms.length === 0 ? (
                        <SelectItem value="no-rooms" disabled>
                          사용 가능한 회의실이 없습니다
                        </SelectItem>
                      ) : (
                        rooms.map((room) => (
                          <SelectItem key={room.roomId} value={room.roomId.toString()}>
                            <div className="flex flex-col">
                              <span className="font-medium">{room.name}</span>
                              <span className="text-sm text-gray-500">
                                {room.location} · 최대 {room.capacity}명
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedRoom && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">{selectedRoom.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{selectedRoom.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {selectedRoom.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        최대 {selectedRoom.capacity}명
                      </div>
                      {selectedRoom.equipment && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="px-2 py-1 bg-white rounded text-xs border">
                            {selectedRoom.equipment}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 날짜 및 시간 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  날짜 및 시간
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  {/* Date Picker */}
                  <div className="flex flex-col gap-3 flex-1">
                    <Label htmlFor="date-picker" className="px-1">
                      날짜 *
                    </Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date-picker"
                          className="justify-between font-normal h-10"
                        >
                          {selectedDate ? selectedDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          }) : "날짜 선택"}
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-6" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="[&_.rdp-months]:text-lg [&_.rdp-day]:h-12 [&_.rdp-day]:w-12 [&_.rdp-caption]:text-base [&_.rdp-head_cell]:text-base"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">시간 선택</Label>
                    {(formData.startTime || formData.endTime) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetTimeSelection}
                        className="h-8 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                        시간 초기화
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Start Time */}
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="start-time-picker" className="px-1">
                        시작 시간 *
                      </Label>
                      <Select
                        value={formData.startTime}
                        onValueChange={(value) => handleInputChange('startTime', value)}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            <SelectValue placeholder="시작 시간 선택" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {startTimeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* End Time */}
                    <div className="flex flex-col gap-3">
                      <Label htmlFor="end-time-picker" className="px-1">
                        종료 시간 *
                      </Label>
                      <Select
                        value={formData.endTime}
                        onValueChange={(value) => handleInputChange('endTime', value)}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-500" />
                            <SelectValue placeholder="종료 시간 선택" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {endTimeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {selectedDate && formData.startTime && formData.endTime && (
                  <div className="flex items-center text-sm text-gray-600 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </div>
                      <div className="text-blue-600">
                        {formData.startTime} - {formData.endTime}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!formData.title || !formData.roomId || !formData.date || !formData.startTime || !formData.endTime || !formData.attendees || submitting}
              >
                {submitting ? '예약 중...' : '예약하기'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}