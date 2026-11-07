import { m } from "../i18n";
import { Accordion } from "./accordion";

/** 자주 묻는 질문 — 고객센터. 배송·반품·보증 약속은 위 안내가 맡고 여기는 그 밖의 질문만 둔다 */
export function Faq() {
  return (
    <Accordion
      items={[
        { id: "q1", title: m.faq_q1(), body: m.faq_a1() },
        { id: "q2", title: m.faq_q2(), body: m.faq_a2() },
      ]}
    />
  );
}
