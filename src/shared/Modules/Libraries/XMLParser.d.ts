/*
 * @example const xml = """
  <fruit>
    <name>Apple</name>
    <color>Red</color>
  </fruit>
  <fruit>
    <name>Banana</name>
    <color>Yellow</color>
  </fruit>
	"""
	Output:
	{
    ["fruit"] = {
      [1] = {
        ["color"] = "Red",
        ["name"] = "Apple"
      }
      [2] = {
        ["color"] = "Yellow",
        ["name"] = "Banana"
      }
    }
	}
 */

/**
 * All tags are in alphabetical order (but this doesn’t affect retrieving data
 * from the array)
 * 
 * In case of multiple tags with the same name, they get merged under one tag,
 * but with a separate table for each original tag
 * 
 * Content that is not a tag but formatted similarly to XML (e.g. HTML,
 * RichText) might be added to the array as a new tag (and there is not
 * really a workaround)
 */
declare function parseXML(string: string): object

export = parseXML