'use client';

import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'fetching', 'parsing', 'matching'
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      setStatus('Fetching GitHub Profile...');
      // Simulate steps for now until API is ready
      // const res = await fetch('/api/match', { ... }) 
      
      // Temporary mock flow to test UI
      await new Promise(r => setTimeout(r, 1000));
      setStatus('Analyzing Code Quality...');
      await new Promise(r => setTimeout(r, 1000));
      setStatus('Matching with Companies...');
      
      // Call actual API
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to match');
      }

      setResult(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center mb-5">
        <Col md={8} className="text-center">
          <h1 className="display-4 fw-bold mb-3">DevTalentMatch</h1>
          <p className="lead text-muted">
            Stop sending resumes. Let your code speak for itself.
            We parse your GitHub and match you with companies looking for <b>your</b> specific skills.
          </p>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="shadow-sm border-0 p-4">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>GitHub Username</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., torvalds" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    size="lg"
                  />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" size="lg" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {status}
                      </>
                    ) : (
                      'Find My Match'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {error && (
            <Alert variant="danger" className="mt-4">
              {error}
            </Alert>
          )}
        </Col>
      </Row>

      {result && (
        <Row className="justify-content-center mt-5 fade-in">
          <Col md={8}>
            <h2 className="text-center mb-4">🎉 We Found a Match!</h2>
            <Card className="border-success shadow">
              <Card.Header className="bg-success text-white fw-bold">
                {result.company.name}
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-3">
                  <span className="badge bg-secondary me-2">{result.company.industry}</span>
                  <span className="badge bg-info text-dark">Match Score: {result.matchScore}%</span>
                </div>
                <Card.Text className="lead">
                  {result.company.description}
                </Card.Text>
                
                <hr />
                
                <h5>Why you matched:</h5>
                <p>{result.matchReason}</p>
                
                <div className="mt-4 d-grid gap-2 d-md-block">
                    <Button variant="success" size="lg" className="me-md-2">Apply Now</Button>
                    <Button variant="outline-secondary" size="lg">View Company Profile</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}