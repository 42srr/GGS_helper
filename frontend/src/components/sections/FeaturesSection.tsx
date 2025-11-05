import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  MessageSquare,
  UserPlus,
  Clock,
  MapPin,
  Settings,
  BarChart3
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            주요 기능
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            42경산 캠퍼스의 효율적인 동아리 운영과 회의실 관리를 위한 핵심 기능들을 소개합니다.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <Users className="w-6 h-6 mr-2 text-blue-600" />
              동아리 관리
            </h3>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-green-600" />
                    동아리 개설 & 가입
                  </CardTitle>
                  <CardDescription>
                    새로운 동아리를 쉽게 만들고, 관심있는 동아리에 가입할 수 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-600" />
                    멤버 관리
                  </CardTitle>
                  <CardDescription>
                    동아리장 위임, 역할 설정, 멤버 승인 등 체계적인 멤버 관리가 가능합니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-orange-600" />
                    동아리 게시판
                  </CardTitle>
                  <CardDescription>
                    공지사항, 자유게시판을 통해 동아리 내 소통을 활성화할 수 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-green-600" />
              회의실 예약
            </h3>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    회의실 정보
                  </CardTitle>
                  <CardDescription>
                    회의실 위치, 수용인원, 장비 등 상세 정보를 확인할 수 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-red-600" />
                    실시간 예약
                  </CardTitle>
                  <CardDescription>
                    원하는 날짜와 시간에 회의실을 즉시 예약하고 관리할 수 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                    예약 현황
                  </CardTitle>
                  <CardDescription>
                    관리자 대시보드를 통해 전체 예약 현황을 한눈에 파악할 수 있습니다.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-6">
            지금 시작하기
          </Button>
        </div>
      </div>
    </section>
  );
}