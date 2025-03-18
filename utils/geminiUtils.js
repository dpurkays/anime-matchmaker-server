const parseAIresponse = (result) => {
    const responseText = result.response.text();
    const parsedData = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    if (!parsedData) throw new Error("Failed to extract JSON");
    return JSON.parse(parsedData);
}

export { parseAIresponse };
