import React, { useEffect, useRef, useState } from "react";
import { Col, Row, Card, Form, Button, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import PageTitle from "../../layouts/PageTitle";
import { askAiReport } from "./aiReportApi";
import "./AiReport.css";

const PROMPT_CATEGORIES = [
  {
    title: "Sales & Purchase",
    icon: "fa-file-invoice-dollar",
    prompts: [
      "What are total approved sales and purchases for the selected period?",
      "Compare sales vs purchases and show the net difference.",
      "Who are my top 5 customers by sales amount?",
      "Who are my top vendors by purchase amount?",
    ],
  },
  {
    title: "GST & Tax",
    icon: "fa-percent",
    prompts: [
      "Give me a GST summary — outward vs inward tax.",
      "What is the net tax position for this period?",
    ],
  },
  {
    title: "Tally & Sync",
    icon: "fa-sync-alt",
    prompts: [
      "How many documents are pending Tally push?",
      "List documents waiting for Tally export.",
    ],
  },
  {
    title: "Status & Links",
    icon: "fa-link",
    prompts: [
      "How many invoices are pending approval?",
      "Are there any unlinked credit notes or debit notes?",
      "Summarize recent accounting activity.",
    ],
  },
];

const QUICK_START = [
  "Monthly sales vs purchase summary",
  "GST position this quarter",
  "Pending Tally push count",
  "Top customers report",
];

const defaultRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
};

function getCompanyLabel() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.company_id || "Your company";
  } catch {
    return "Your company";
  }
}

function getUserInitials() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const name = user.username || user.email || "U";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  } catch {
    return "U";
  }
}

const AiReport = () => {
  const [range, setRange] = useState(defaultRange);
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submitQuestion = async (text) => {
    const q = (text || question).trim();
    if (!q || loading) return;

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q, id: Date.now() }]);
    setLoading(true);

    try {
      const result = await askAiReport({
        question: q,
        from: useDateFilter ? range.from : undefined,
        to: useDateFilter ? range.to : undefined,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          id: Date.now() + 1,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "error", content: error.message || "Something went wrong", id: Date.now() + 1 },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const copyAnswer = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  const clearChat = () => {
    setMessages([]);
    setQuestion("");
  };

  const formatDateLabel = () => {
    if (!useDateFilter) return "All time";
    return `${range.from} → ${range.to}`;
  };

  return (
    <div className="ai-report-page">
      <PageTitle activeMenu="AI Report" motherMenu="Accounting" />

      <Row className="mb-3 g-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex flex-wrap align-items-center gap-3">
              <div className="ai-report-overview-icon">
                <i className="fa fa-robot" />
              </div>
              <div className="flex-grow-1">
                <h5 className="mb-1 fw-bold">AI Accounting Report</h5>
                <p className="text-muted mb-0 small">
                  Ask questions about sales, purchases, vouchers, GST, and Tally sync.
                  Answers use your company data only.
                </p>
              </div>
              <span className="ai-report-company-pill">
                <i className="fa fa-building" />
                {getCompanyLabel()}
              </span>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <h6 className="text-muted mb-2">How it works</h6>
              <ul className="small text-muted mb-0 ps-3">
                <li className="mb-1">Pick a suggested question or type your own</li>
                <li className="mb-1">AI reads your accounting records</li>
                <li>Get report-ready insights instantly</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-3 ai-report-filter-card">
        <Card.Body className="d-flex flex-wrap align-items-end gap-3">
          <div>
            <Form.Check
              type="switch"
              id="use-date-filter"
              label="Filter by date range"
              checked={useDateFilter}
              onChange={(e) => setUseDateFilter(e.target.checked)}
              className="mb-0"
            />
          </div>
          {useDateFilter && (
            <>
              <div>
                <label className="form-label" htmlFor="ai-from-date">
                  From
                </label>
                <Form.Control
                  id="ai-from-date"
                  type="date"
                  value={range.from}
                  onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="ai-to-date">
                  To
                </label>
                <Form.Control
                  id="ai-to-date"
                  type="date"
                  value={range.to}
                  onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                />
              </div>
            </>
          )}
          {!useDateFilter && (
            <span className="text-muted small pb-1">Using all available company records.</span>
          )}
        </Card.Body>
      </Card>

      <div className="ai-report-layout">
          <aside className="ai-report-sidebar">
            <div className="ai-report-sidebar-header">
              <i className="fa fa-lightbulb text-primary me-2" />
              Suggested questions
            </div>
            <div className="flex-grow-1 overflow-auto">
              {PROMPT_CATEGORIES.map((cat) => (
                <div key={cat.title} className="ai-report-category">
                  <div className="ai-report-category-title">
                    <i className={`fa ${cat.icon}`} />
                    {cat.title}
                  </div>
                  {cat.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="ai-report-prompt-chip"
                      disabled={loading}
                      onClick={() => submitQuestion(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <section className="ai-report-chat">
            <div className="ai-report-chat-header">
              <div>
                <span className="fw-semibold">Report Assistant</span>
                <Badge bg="primary" className="ms-2 fw-normal">
                  {formatDateLabel()}
                </Badge>
              </div>
              {messages.length > 0 && (
                <Button variant="outline-primary" size="sm" onClick={clearChat} disabled={loading}>
                  <i className="fa fa-trash-alt me-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="ai-report-messages">
              {!messages.length && !loading && (
                <div className="ai-report-empty">
                  <div className="ai-report-empty-icon">
                    <i className="fa fa-chart-line" />
                  </div>
                  <h5 className="fw-semibold mb-2">Start your report</h5>
                  <p className="text-muted small mb-0 max-w-400">
                    Pick a suggested question or type your own. The AI analyzes your accounting
                    data and returns insights you can use in reports.
                  </p>
                  <div className="ai-report-empty-grid">
                    {QUICK_START.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className="ai-report-prompt-chip mb-0"
                        disabled={loading}
                        onClick={() => submitQuestion(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`ai-report-message-row ${msg.role === "user" ? "user" : ""}`}>
                  <div className={`ai-report-avatar ${msg.role}`}>
                    {msg.role === "user" ? (
                      getUserInitials()
                    ) : msg.role === "error" ? (
                      <i className="fa fa-exclamation" />
                    ) : (
                      <i className="fa fa-robot" />
                    )}
                  </div>
                  <div className={`ai-report-bubble ${msg.role}`}>
                    <div className="ai-report-bubble-label">
                      {msg.role === "user" ? "You" : msg.role === "error" ? "Error" : "AI Report"}
                    </div>
                    {msg.content}
                    {msg.role === "assistant" && (
                      <div className="ai-report-bubble-actions">
                        <button
                          type="button"
                          className="ai-report-copy-btn"
                          onClick={() => copyAnswer(msg.content)}
                        >
                          <i className="fa fa-copy" />
                          Copy answer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="ai-report-typing">
                  <div className="ai-report-avatar assistant">
                    <i className="fa fa-robot" />
                  </div>
                  <div>
                    <div className="ai-report-typing-dots mb-1">
                      <span />
                      <span />
                      <span />
                    </div>
                    Analyzing {getCompanyLabel()} data...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="ai-report-composer">
              <div className="ai-report-input-wrap">
                <textarea
                  ref={inputRef}
                  rows={2}
                  placeholder="Ask anything about your accounting data..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="ai-report-send-btn"
                  disabled={loading || !question.trim()}
                  onClick={() => submitQuestion()}
                  aria-label="Send"
                >
                  <i className="fa fa-paper-plane" />
                </button>
              </div>
              <div className="ai-report-composer-hint">
                Press Enter to send · Shift+Enter for new line · Data scoped to your company only
              </div>
            </div>
          </section>
        </div>
    </div>
  );
};

export default AiReport;
