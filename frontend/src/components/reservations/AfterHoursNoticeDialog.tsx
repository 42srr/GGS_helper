import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle } from 'lucide-react';

interface AfterHoursNoticeDialogProps {
  isOpen: boolean;
  roomName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AfterHoursNoticeDialog({
  isOpen,
  roomName,
  onConfirm,
  onCancel,
}: AfterHoursNoticeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">
              업무시간 외 예약 안내
            </DialogTitle>
          </div>
          <DialogDescription>
            업무시간 외 예약 신청 시 승인이 지연될 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-yellow-900">
                  현재 업무시간이 아닙니다
                </p>
                <p className="text-yellow-800 text-sm">
                  <strong>"{roomName}"</strong>는 승인이 필요한 회의실입니다.
                </p>
                <p className="text-yellow-800 text-sm">
                  업무시간(평일 09:00~18:00) 외에 신청된 예약은
                  관리자 승인이 지연될 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              💡 참고사항
            </p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>업무시간 내 신청 시 빠른 승인이 가능합니다</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>승인이 지연되어도 예약 신청은 정상적으로 접수됩니다</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>승인 상태는 "내 예약" 페이지에서 확인할 수 있습니다</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-600 text-sm text-center pt-2">
            그래도 지금 예약을 신청하시겠습니까?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-700"
          >
            예약 신청하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
