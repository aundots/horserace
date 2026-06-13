import { colors } from "@toss/tds-colors";
import { Button, Top } from "@toss/tds-mobile";

interface HelpPageProps {
  onBack: () => void;
}

export function HelpPage({ onBack }: HelpPageProps) {
  return (
    <>
      <Top title={<Top.TitleParagraph size={22}>도움말</Top.TitleParagraph>} />

      <div style={{ padding: "0 20px 24px", fontSize: 14, lineHeight: 1.6, color: colors.grey800 }}>
        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>플레이 방법</h3>
        <p>
          경주 티켓으로 출전 → 찌라시 P로 8두 정보 열람 → 1착 예상 → 경주 관람.
          예상 적중 여부는 기록되지만, 적중해도 찌라시 P는 추가 지급되지 않습니다.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>경주 티켓 · 광고</h3>
        <p>
          <strong>하루 1회</strong> 무료 경주 후, 추가 경주는 <strong>광고 시청으로 티켓</strong>을
          받아야 합니다. 티켓이 없으면 완주 화면에서 「광고 보고 티켓 · 다음 경주」를 이용하세요.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>찌라시 P</h3>
        <p>
          말마다 1~3P로 찌라시를 엽니다. P가 부족하면 <strong>광고로 P+4</strong>를 받을 수
          있어요. 티켓이 남아 있을 때 경주 사이 광고는 P 보충용입니다.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>친구와 맞추기 (내기)</h3>
        <p>
          홈에서 <strong>친구와 맞추기</strong>로 방을 만들고 코드를 공유하세요.
          1~8번·<strong>말 이름</strong>은 공개(응원용). 스탯·기수는 숨김.
          경기마다 찌라시 <strong>3장</strong>, <strong>같은 말은 한 명만</strong> 선택.
        </p>
        <p>
          1경기부터 N경기까지 연속 가능. 착순 점수:{" "}
          <strong>1착 10 · 2착 8 · 3착 5 · 4착 3 · 5착 2 · 6착 1 · 7·8착 0</strong>.
          여러 경기 점수를 <strong>누적</strong>하고, 합계가{" "}
          <strong>가장 낮은 사람</strong>이 내기에서 지는 쪽으로 정하면 됩니다.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>연속 플레이</h3>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>완주 후 <strong>바로 다음 경주</strong>로 이어서 플레이할 수 있어요.</li>
          <li><strong>3경주 연속</strong> 완주 시 찌라시 무료 1장이 지급됩니다.</li>
          <li>하루 <strong>5경주</strong> 완주 시 골드 보너스가 지급됩니다.</li>
          <li>홈으로 가면 연속 출전 스트릭이 초기화됩니다.</li>
        </ul>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>골드</h3>
        <p>
          경주 완주·출석·일일 챌린지 보상입니다. 티켓 구매에는 사용하지 않습니다.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>낙마·사고</h3>
        <p>
          <strong>단독 낙마</strong> — 플랫 경주 기준 약 <strong>0.14%/구간</strong> (JRA 통계
          참고). 코너·피로·컨디션에 따라 달라집니다.
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>간섭 사고</strong> — 말들이 좁은 주로에서 엉켜 달릴 때 추가로 발생합니다.
          코너·습윤·무거운 주로에서, 3두 이상 밀집 시 특히 높아집니다. 앞 다툼에 휘말리면
          기권(DNF) 처리됩니다.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>정책</h3>
        <p>
          베팅·마권·배당 없음. 예상은 게임 내 기록·보상만. 골드→현금 환전 불가.
        </p>

        <h3 style={{ fontSize: 16, margin: "16px 0 8px" }}>고객센터</h3>
        <p>문의: ssampoto@gmail.com</p>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <Button display="block" size="large" color="dark" variant="weak" onClick={onBack}>
          돌아가기
        </Button>
      </div>
    </>
  );
}
